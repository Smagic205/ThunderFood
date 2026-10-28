package com.thunderfood.backend.service;

import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.auth.AuthResponse;
import com.thunderfood.backend.dto.auth.LoginRequest;
import com.thunderfood.backend.dto.auth.RegisterRequest;
import com.thunderfood.backend.dto.auth.ResetPasswordRequest;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.entity.UserToken;
import com.thunderfood.backend.repository.AddressRepository;
import com.thunderfood.backend.repository.RoleRepository;
import com.thunderfood.backend.repository.UserRepository;
import com.thunderfood.backend.repository.UserTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;
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

    @InjectMocks
    private AuthService authService;

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
    @DisplayName("Đăng ký thành công trả về AuthResponse")
    void testRegister_Success() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Nguyễn Văn A");
        request.setEmail("user@gmail.com");
        request.setPassword("12345678");
        request.setPhone("0987654321");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(roleRepository.findByName("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        mockAuthResponseGeneration();

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getToken());
        assertEquals("mock-refresh-token", response.getRefreshToken());
        assertEquals("user@gmail.com", response.getUser().getEmail());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Đăng ký ném ngoại lệ khi email đã tồn tại")
    void testRegister_EmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("user@gmail.com");

        when(userRepository.existsByEmail("user@gmail.com")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.register(request));
        assertEquals("Email đã được sử dụng", ex.getMessage());
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
    @DisplayName("Đăng nhập thất bại khi tài khoản bị khóa")
    void testLogin_LockedAccount() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@gmail.com");
        request.setPassword("12345678");

        mockUser.setStatus("LOCKED");

        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.login(request));
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
    @DisplayName("Quên mật khẩu thất bại khi email không tồn tại")
    void testForgotPassword_UserNotFound() {
        when(userRepository.findByEmail("notfound@gmail.com")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.forgotPassword("notfound@gmail.com"));
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

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.resetPassword(request));
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

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.resetPassword(request));
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

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.resetPassword(request));
        assertEquals("Mã OTP đã hết hạn", ex.getMessage());
        verify(userTokenRepository).delete(expiredToken);
    }

    @Test
    @DisplayName("Làm mới token thành công khi Refresh Token hợp lệ")
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
        when(userTokenRepository.findByUserIdAndType(mockUser.getId(), "REFRESH_TOKEN")).thenReturn(Optional.of(tokenEntity));
        mockAuthResponseGeneration();

        AuthResponse response = authService.refreshToken(refreshToken);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getToken());
    }

    @Test
    @DisplayName("Đăng nhập nhân viên thất bại khi tài khoản không phải STAFF")
    void testLoginStaff_WrongRole() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@gmail.com");
        request.setPassword("12345678");

        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(mockUser)); // Role is CUSTOMER

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.loginStaff(request));
        assertEquals("Tài khoản này không có quyền truy cập của nhân viên", ex.getMessage());
    }
}
