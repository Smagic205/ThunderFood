package com.thunderfood.backend.service;

import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.auth.AuthResponse;
import com.thunderfood.backend.dto.auth.GoogleAuthRequest;
import com.thunderfood.backend.dto.auth.GoogleUserInfo;
import com.thunderfood.backend.dto.auth.LoginRequest;
import com.thunderfood.backend.dto.auth.RegisterRequest;
import com.thunderfood.backend.dto.auth.ResetPasswordRequest;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.entity.UserToken;
import com.thunderfood.backend.exception.ConflictException;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.exception.UnauthorizedException;
import com.thunderfood.backend.repository.AddressRepository;
import com.thunderfood.backend.repository.RoleRepository;
import com.thunderfood.backend.repository.UserRepository;
import com.thunderfood.backend.repository.UserTokenRepository;
import com.thunderfood.backend.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserTokenRepository userTokenRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private EmailService emailService;

    @Mock
    private GoogleAuthService googleAuthService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User mockUser;
    private Role customerRole;
    private Role staffRole;

    @BeforeEach
    void setUp() {
        customerRole = Role.builder().id(1).name("CUSTOMER").build();
        staffRole = Role.builder().id(2).name("STAFF").build();

        mockUser = User.builder()
                .id(1L)
                .fullName("Nguyễn Văn A")
                .email("user@gmail.com")
                .passwordHash("encodedPassword")
                .phone("0987654321")
                .role(customerRole)
                .status("ACTIVE")
                .build();
    }

    private void mockAuthResponseGeneration() {
        when(jwtService.generateToken(any())).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken(any())).thenReturn("mock-refresh-token");
        when(addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(any()))
                .thenReturn(Collections.emptyList());
    }

    @Test
    @DisplayName("Đăng ký thành công trả về AuthResponse yêu cầu kích hoạt email")
    void testRegister_Success() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Nguyễn Văn A");
        request.setEmail("user@gmail.com");
        request.setPassword("12345678");
        request.setPhone("0987654321");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());
        when(roleRepository.findByName("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        when(userTokenRepository.save(any(UserToken.class))).thenAnswer(i -> i.getArgument(0));

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertTrue(response.getRequiresVerification());
        assertEquals("user@gmail.com", response.getUser().getEmail());
        verify(emailService).sendAccountActivationEmail(eq("user@gmail.com"), eq("Nguyễn Văn A"), anyString());
        verify(userRepository).save(any(User.class));
        verify(userTokenRepository).save(any(UserToken.class));
    }

    @Test
    @DisplayName("Đăng ký ném ConflictException khi email đã tồn tại (HTTP 409)")
    void testRegister_EmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("user@gmail.com");

        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser));

        ConflictException ex = assertThrows(ConflictException.class, () -> authService.register(request));
        assertEquals("Email đã được sử dụng", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đăng ký ném ConflictException khi dùng email tạm thời / rác")
    void testRegister_DisposableEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Kẻ Spammer");
        request.setEmail("troll99@tempmail.com");
        request.setPassword("12345678");

        ConflictException ex = assertThrows(ConflictException.class, () -> authService.register(request));
        assertTrue(ex.getMessage().contains("không chấp nhận địa chỉ email tạm thời"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đăng ký ném ConflictException khi số điện thoại thuộc tài khoản bị khóa")
    void testRegister_PhoneBelongsToLockedUser() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Nguyễn Văn A");
        request.setEmail("user2@gmail.com");
        request.setPassword("12345678");
        request.setPhone("0987654321");

        when(userRepository.existsByEmail("user2@gmail.com")).thenReturn(false);
        when(userRepository.existsByPhoneAndStatus("0987654321", "LOCKED")).thenReturn(true);

        ConflictException ex = assertThrows(ConflictException.class, () -> authService.register(request));
        assertTrue(ex.getMessage().contains("Số điện thoại này đã bị khóa do vi phạm chính sách"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đăng nhập thành công trả về AuthResponse")
    void testLogin_Success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@gmail.com");
        request.setPassword("12345678");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser));
        mockAuthResponseGeneration();

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getToken());
        assertEquals("user@gmail.com", response.getUser().getEmail());
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi tài khoản bị khóa (HTTP 403 AccessDeniedException)")
    void testLogin_LockedAccount() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@gmail.com");
        request.setPassword("12345678");

        mockUser.setStatus("LOCKED");

        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> authService.login(request));
        assertEquals("Tài khoản đã bị khóa", ex.getMessage());
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi sai email hoặc mật khẩu")
    void testLogin_BadCredentials() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@gmail.com");
        request.setPassword("wrongpassword");

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Sai thông tin đăng nhập"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Quên mật khẩu gửi OTP thành công")
    void testForgotPassword_Success() {
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser));

        authService.forgotPassword("user@gmail.com");

        verify(userTokenRepository).deleteByUserIdAndType(mockUser.getId(), "OTP");
        verify(userTokenRepository).save(any(UserToken.class));
        verify(emailService).sendPasswordResetOtp(eq("user@gmail.com"), anyString());
    }

    @Test
    @DisplayName("Quên mật khẩu thất bại khi email không tồn tại (HTTP 404 ResourceNotFoundException)")
    void testForgotPassword_UserNotFound() {
        when(userRepository.findByEmail("notfound@gmail.com")).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () -> authService.forgotPassword("notfound@gmail.com"));
        assertEquals("Không tìm thấy tài khoản với email này", ex.getMessage());
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thành công khi OTP hợp lệ")
    void testResetPassword_Success() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("user@gmail.com");
        request.setOtp("123456");
        request.setNewPassword("newPass123");

        UserToken token = UserToken.builder()
                .user(mockUser)
                .token("123456")
                .type("OTP")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();

        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser));
        when(userTokenRepository.findByUserIdAndType(mockUser.getId(), "OTP")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("newPass123")).thenReturn("newEncodedPass");

        authService.resetPassword(request);

        verify(userRepository).save(mockUser);
        verify(userTokenRepository).delete(token);
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thất bại khi OTP không chính xác và tăng số lần thử")
    void testResetPassword_WrongOtp() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("user@gmail.com");
        request.setOtp("999999");
        request.setNewPassword("newPass123");

        UserToken token = UserToken.builder()
                .user(mockUser)
                .token("123456")
                .type("OTP")
                .failedAttempts(0)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser));
        when(userTokenRepository.findByUserIdAndType(mockUser.getId(), "OTP")).thenReturn(Optional.of(token));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.resetPassword(request));
        assertTrue(ex.getMessage().contains("Mã OTP không chính xác. Bạn còn 4 lần thử."));
        assertEquals(1, token.getFailedAttempts());
        verify(userTokenRepository).save(token);
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thất bại và vô hiệu hóa mã khi nhập sai quá 5 lần (Brute-force protection)")
    void testResetPassword_TooManyAttempts() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("user@gmail.com");
        request.setOtp("999999");
        request.setNewPassword("newPass123");

        UserToken token = UserToken.builder()
                .user(mockUser)
                .token("123456")
                .type("OTP")
                .failedAttempts(4) // Đã sai 4 lần, lần này là lần thứ 5
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser));
        when(userTokenRepository.findByUserIdAndType(mockUser.getId(), "OTP")).thenReturn(Optional.of(token));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.resetPassword(request));
        assertTrue(ex.getMessage().contains("Mã OTP đã bị vô hiệu hóa do nhập sai quá 5 lần"));
        verify(userTokenRepository).delete(token);
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thất bại khi OTP đã hết hạn")
    void testResetPassword_ExpiredOtp() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("user@gmail.com");
        request.setOtp("123456");
        request.setNewPassword("newPass123");

        UserToken expiredToken = UserToken.builder()
                .user(mockUser)
                .token("123456")
                .type("OTP")
                .failedAttempts(0)
                .expiresAt(LocalDateTime.now().minusMinutes(1)) // đã hết hạn
                .build();

        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser));
        when(userTokenRepository.findByUserIdAndType(mockUser.getId(), "OTP")).thenReturn(Optional.of(expiredToken));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.resetPassword(request));
        assertEquals("Mã OTP đã hết hạn", ex.getMessage());
        verify(userTokenRepository).delete(expiredToken);
    }

    @Test
    @DisplayName("Làm mới token thành công và xoay vòng Refresh Token (Token Rotation)")
    void testRefreshToken_Success() {
        String refreshToken = "valid-refresh-token";

        UserToken tokenEntity = UserToken.builder()
                .user(mockUser)
                .token(refreshToken)
                .type("REFRESH_TOKEN")
                .expiresAt(LocalDateTime.now().plusDays(5))
                .build();

        when(jwtService.extractUsername(refreshToken)).thenReturn("user@gmail.com");
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser));
        when(jwtService.isTokenValid(eq(refreshToken), any(UserDetailsImpl.class))).thenReturn(true);
        when(userTokenRepository.findByTokenAndType(refreshToken, "REFRESH_TOKEN")).thenReturn(Optional.of(tokenEntity));
        mockAuthResponseGeneration();

        AuthResponse response = authService.refreshToken(refreshToken);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getToken());
        assertEquals("mock-refresh-token", response.getRefreshToken());
        verify(userTokenRepository).save(tokenEntity);
    }

    @Test
    @DisplayName("Làm mới token ném AccessDeniedException khi tài khoản bị khóa")
    void testRefreshToken_LockedAccount() {
        String refreshToken = "valid-refresh-token";
        User lockedUser = User.builder().id(1L).email("user@gmail.com").status("LOCKED").build();

        when(jwtService.extractUsername(refreshToken)).thenReturn("user@gmail.com");
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(lockedUser));

        assertThrows(AccessDeniedException.class, () -> authService.refreshToken(refreshToken));
    }

    @Test
    @DisplayName("Đăng xuất thiết bị xóa đúng Refresh Token của thiết bị đó")
    void testLogout_Success() {
        String refreshToken = "device-refresh-token";
        authService.logout(refreshToken);
        verify(userTokenRepository).deleteByToken(refreshToken);
    }

    @Test
    @DisplayName("Đăng xuất toàn bộ thiết bị xóa tất cả Refresh Token của user")
    void testLogoutAllDevices_Success() {
        authService.logoutAllDevices(1L);
        verify(userTokenRepository).deleteByUserIdAndType(1L, "REFRESH_TOKEN");
    }

    @Test
    @DisplayName("Đăng nhập vượt quá số phiên tối đa sẽ thu hồi các phiên cũ nhất")
    void testLogin_ExceedsMaxSessions_RemovesOldestSession() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@gmail.com");
        request.setPassword("12345678");

        UserToken oldToken1 = UserToken.builder().id(101L).build();
        UserToken oldToken2 = UserToken.builder().id(102L).build();
        UserToken oldToken3 = UserToken.builder().id(103L).build();
        UserToken oldToken4 = UserToken.builder().id(104L).build();
        UserToken oldToken5 = UserToken.builder().id(105L).build();
        List<UserToken> existingTokens = List.of(oldToken1, oldToken2, oldToken3, oldToken4, oldToken5);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser));
        when(userTokenRepository.findByUserIdAndTypeOrderByCreatedAtAsc(1L, "REFRESH_TOKEN"))
                .thenReturn(existingTokens);
        mockAuthResponseGeneration();

        authService.login(request);

        // Phiên thứ 6 sẽ xóa phiên cũ nhất (oldToken1)
        verify(userTokenRepository).delete(oldToken1);
        verify(userTokenRepository).save(any(UserToken.class));
    }

    @Test
    @DisplayName("Làm mới token thất bại khi token không tồn tại trong DB (HTTP 401 UnauthorizedException)")
    void testRefreshToken_TokenNotInDb() {
        String refreshToken = "revoked-refresh-token";

        when(jwtService.extractUsername(refreshToken)).thenReturn("user@gmail.com");
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser));
        when(jwtService.isTokenValid(eq(refreshToken), any(UserDetailsImpl.class))).thenReturn(true);
        when(userTokenRepository.findByTokenAndType(refreshToken, "REFRESH_TOKEN")).thenReturn(Optional.empty());

        UnauthorizedException ex = assertThrows(UnauthorizedException.class,
                () -> authService.refreshToken(refreshToken));
        assertEquals("Refresh token không tồn tại hoặc đã bị thu hồi", ex.getMessage());
    }

    @Test
    @DisplayName("Làm mới token thất bại khi token hết hạn/invalid (HTTP 401 UnauthorizedException)")
    void testRefreshToken_InvalidToken() {
        String refreshToken = "expired-refresh-token";

        when(jwtService.extractUsername(refreshToken)).thenReturn("user@gmail.com");
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser));
        when(jwtService.isTokenValid(eq(refreshToken), any(UserDetailsImpl.class))).thenReturn(false);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class,
                () -> authService.refreshToken(refreshToken));
        assertEquals("Refresh token đã hết hạn hoặc không hợp lệ", ex.getMessage());
    }

    @Test
    @DisplayName("Đăng nhập nhân viên thất bại khi tài khoản không phải STAFF (HTTP 403 AccessDeniedException)")
    void testLoginStaff_WrongRole() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@gmail.com");
        request.setPassword("12345678");

        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser)); // Role is CUSTOMER

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> authService.loginStaff(request));
        assertEquals("Tài khoản này không có quyền truy cập của nhân viên", ex.getMessage());
    }

    @Test
    @DisplayName("Đăng nhập với Google tạo tài khoản mới nếu chưa tồn tại")
    void testLoginWithGoogle_NewUser() {
        GoogleAuthRequest request = new GoogleAuthRequest("google-id-token-abc");
        GoogleUserInfo googleInfo = GoogleUserInfo.builder()
                .sub("google-123456")
                .email("googleuser@gmail.com")
                .name("Google User")
                .picture("https://lh3.google.com/photo.jpg")
                .emailVerified(true)
                .build();

        when(googleAuthService.verifyToken("google-id-token-abc")).thenReturn(googleInfo);
        when(userRepository.findByEmail("googleuser@gmail.com")).thenReturn(Optional.empty());
        when(roleRepository.findByName("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(99L);
            return u;
        });
        mockAuthResponseGeneration();

        AuthResponse response = authService.loginWithGoogle(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getToken());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Đăng nhập với Google liên kết tài khoản đã tồn tại và kích hoạt nếu UNVERIFIED")
    void testLoginWithGoogle_ExistingUser() {
        GoogleAuthRequest request = new GoogleAuthRequest("google-id-token-abc");
        GoogleUserInfo googleInfo = GoogleUserInfo.builder()
                .sub("google-123456")
                .email("user@gmail.com")
                .name("Nguyễn Văn A")
                .picture("https://lh3.google.com/photo.jpg")
                .emailVerified(true)
                .build();

        mockUser.setStatus("UNVERIFIED");

        when(googleAuthService.verifyToken("google-id-token-abc")).thenReturn(googleInfo);
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        mockAuthResponseGeneration();

        AuthResponse response = authService.loginWithGoogle(request);

        assertNotNull(response);
        assertEquals("ACTIVE", mockUser.getStatus());
        assertEquals("google-123456", mockUser.getProviderId());
    }

    @Test
    @DisplayName("Kích hoạt tài khoản bằng token thành công")
    void testVerifyEmail_Success() {
        User unverifiedUser = User.builder()
                .id(2L)
                .email("unverified@gmail.com")
                .fullName("Unverified User")
                .status("UNVERIFIED")
                .role(customerRole)
                .build();

        UserToken token = UserToken.builder()
                .id(10L)
                .user(unverifiedUser)
                .token("valid-activation-token")
                .type("ACTIVATION")
                .expiresAt(LocalDateTime.now().plusHours(12))
                .build();

        when(userTokenRepository.findByTokenAndType("valid-activation-token", "ACTIVATION"))
                .thenReturn(Optional.of(token));
        when(userRepository.save(any(User.class))).thenReturn(unverifiedUser);
        mockAuthResponseGeneration();

        AuthResponse response = authService.verifyEmail("valid-activation-token");

        assertNotNull(response);
        assertEquals("ACTIVE", unverifiedUser.getStatus());
        verify(userTokenRepository).delete(token);
    }

    @Test
    @DisplayName("Kích hoạt tài khoản ném IllegalArgumentException khi token đã hết hạn")
    void testVerifyEmail_ExpiredToken() {
        User unverifiedUser = User.builder().id(2L).status("UNVERIFIED").build();
        UserToken expiredToken = UserToken.builder()
                .id(10L)
                .user(unverifiedUser)
                .token("expired-token")
                .type("ACTIVATION")
                .expiresAt(LocalDateTime.now().minusHours(1))
                .build();

        when(userTokenRepository.findByTokenAndType("expired-token", "ACTIVATION"))
                .thenReturn(Optional.of(expiredToken));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> authService.verifyEmail("expired-token"));
        assertTrue(ex.getMessage().contains("đã hết hạn"));
        verify(userTokenRepository).delete(expiredToken);
    }

    @Test
    @DisplayName("Gửi lại email kích hoạt thành công")
    void testResendActivationEmail_Success() {
        User unverifiedUser = User.builder()
                .id(2L)
                .email("unverified@gmail.com")
                .fullName("Unverified User")
                .status("UNVERIFIED")
                .build();

        when(userRepository.findByEmail("unverified@gmail.com")).thenReturn(Optional.of(unverifiedUser));

        authService.resendActivationEmail("unverified@gmail.com");

        verify(userTokenRepository).deleteByUserIdAndType(2L, "ACTIVATION");
        verify(userTokenRepository).save(any(UserToken.class));
        verify(emailService).sendAccountActivationEmail(eq("unverified@gmail.com"), eq("Unverified User"), anyString());
    }

    @Test
    @DisplayName("Đăng nhập ném AccessDeniedException khi tài khoản chưa được kích hoạt")
    void testLogin_UnverifiedAccount() {
        LoginRequest request = new LoginRequest();
        request.setEmail("unverified@gmail.com");
        request.setPassword("12345678");

        User unverifiedUser = User.builder()
                .id(2L)
                .email("unverified@gmail.com")
                .status("UNVERIFIED")
                .role(customerRole)
                .build();

        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(userRepository.findByEmail("unverified@gmail.com")).thenReturn(Optional.of(unverifiedUser));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> authService.login(request));
        assertTrue(ex.getMessage().contains("chưa được kích hoạt"));
    }
}
