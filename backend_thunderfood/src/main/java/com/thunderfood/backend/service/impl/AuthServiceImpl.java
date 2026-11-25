package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.address.AddressResponse;
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
import com.thunderfood.backend.service.AuthService;
import com.thunderfood.backend.service.EmailService;
import com.thunderfood.backend.service.GoogleAuthService;
import com.thunderfood.backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int MAX_ACTIVE_SESSIONS = 5;

    @Value("${jwt.refresh-token.expiration:604800000}")
    private long refreshExpirationMs = 604800000L;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserTokenRepository userTokenRepository;
    private final AddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final GoogleAuthService googleAuthService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl = "http://localhost:5173";

    private static final java.util.Set<String> DISPOSABLE_EMAIL_DOMAINS = java.util.Set.of(
            "tempmail.com", "10minutemail.com", "guerrillamail.com", "mailinator.com",
            "throwawaymail.com", "yopmail.com", "trashmail.com", "sharklasers.com",
            "dispostable.com", "getairmail.com", "temp-mail.org", "mohmal.com"
    );

    private boolean isDisposableEmail(String email) {
        if (email == null || !email.contains("@")) return false;
        String domain = email.substring(email.indexOf("@") + 1).toLowerCase().trim();
        return DISPOSABLE_EMAIL_DOMAINS.contains(domain);
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (isDisposableEmail(request.getEmail())) {
            throw new ConflictException("Hệ thống không chấp nhận địa chỉ email tạm thời / rác. Vui lòng sử dụng email thực.");
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String cleanPhone = request.getPhone().trim();
            if (userRepository.existsByPhoneAndStatus(cleanPhone, "LOCKED")) {
                throw new ConflictException("Số điện thoại này đã bị khóa do vi phạm chính sách của ThunderFood. Không thể tạo tài khoản mới.");
            }
            if (userRepository.existsByPhone(cleanPhone)) {
                throw new ConflictException("Số điện thoại này đã được sử dụng cho một tài khoản khác");
            }
        }

        Optional<User> existingUserOpt = userRepository.findByEmail(request.getEmail().trim());
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            if ("UNVERIFIED".equalsIgnoreCase(existingUser.getStatus())) {
                existingUser.setFullName(request.getFullName().trim());
                existingUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
                if (request.getPhone() != null && !request.getPhone().isBlank()) {
                    existingUser.setPhone(request.getPhone().trim());
                }
                userRepository.save(existingUser);

                userTokenRepository.deleteByUserIdAndType(existingUser.getId(), "ACTIVATION");

                String activationToken = UUID.randomUUID().toString();
                UserToken userToken = UserToken.builder()
                        .user(existingUser)
                        .token(activationToken)
                        .type("ACTIVATION")
                        .expiresAt(LocalDateTime.now().plusHours(24))
                        .failedAttempts(0)
                        .build();
                userTokenRepository.save(userToken);

                String activationLink = frontendUrl + "/verify-email?token=" + activationToken;
                emailService.sendAccountActivationEmail(existingUser.getEmail(), existingUser.getFullName(), activationLink);

                return AuthResponse.builder()
                        .user(AuthResponse.UserDto.builder()
                                .id(existingUser.getId())
                                .email(existingUser.getEmail())
                                .fullName(existingUser.getFullName())
                                .phone(existingUser.getPhone())
                                .role(existingUser.getRole() != null ? existingUser.getRole().getName() : "CUSTOMER")
                                .build())
                        .message("Tài khoản chưa được kích hoạt trước đó. Chúng tôi đã gửi lại email kích hoạt mới đến hòm thư của bạn.")
                        .requiresVerification(true)
                        .build();
            } else {
                throw new ConflictException("Email đã được sử dụng");
            }
        }

        Role userRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new RuntimeException("Role CUSTOMER không tồn tại trong hệ thống"));

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .role(userRole)
                .authProvider("LOCAL")
                .status("UNVERIFIED")
                .build();

        User savedUser = userRepository.save(user);

        // Sinh mã token kích hoạt tài khoản gửi qua email
        String activationToken = UUID.randomUUID().toString();
        UserToken userToken = UserToken.builder()
                .user(savedUser)
                .token(activationToken)
                .type("ACTIVATION")
                .expiresAt(LocalDateTime.now().plusHours(24))
                .failedAttempts(0)
                .build();
        userTokenRepository.save(userToken);

        String activationLink = frontendUrl + "/verify-email?token=" + activationToken;
        emailService.sendAccountActivationEmail(savedUser.getEmail(), savedUser.getFullName(), activationLink);

        return AuthResponse.builder()
                .user(AuthResponse.UserDto.builder()
                        .id(savedUser.getId())
                        .email(savedUser.getEmail())
                        .fullName(savedUser.getFullName())
                        .phone(savedUser.getPhone())
                        .role(savedUser.getRole().getName())
                        .build())
                .message("Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản của bạn trước khi đăng nhập.")
                .requiresVerification(true)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticateCredentials(request.getEmail().trim(), request.getPassword());

        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            throw new AccessDeniedException("Tài khoản đã bị khóa");
        }

        if ("UNVERIFIED".equalsIgnoreCase(user.getStatus())) {
            throw new AccessDeniedException("Tài khoản của bạn chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt tài khoản trước khi đăng nhập.");
        }

        return generateAuthResponse(user);
    }

    private void authenticateCredentials(String email, String password) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
        } catch (DisabledException ex) {
            throw new AccessDeniedException(
                    "Tài khoản của bạn chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt tài khoản trước khi đăng nhập."
            );
        } catch (LockedException ex) {
            throw new AccessDeniedException("Tài khoản đã bị khóa");
        }
    }

    @Override
    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        GoogleUserInfo googleInfo = googleAuthService.verifyToken(request.getIdToken());
        String email = googleInfo.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null) {
            if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
                throw new AccessDeniedException("Tài khoản của bạn đã bị khóa bởi quản trị viên.");
            }

            // Nếu tài khoản trước đó là UNVERIFIED thì qua Google đã xác nhận email thật -> Kích hoạt luôn
            if ("UNVERIFIED".equalsIgnoreCase(user.getStatus())) {
                user.setStatus("ACTIVE");
            }

            if (user.getProviderId() == null && googleInfo.getSub() != null) {
                user.setProviderId(googleInfo.getSub());
            }

            if ((user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) && googleInfo.getPicture() != null) {
                user.setAvatarUrl(googleInfo.getPicture());
            }

            user = userRepository.save(user);
        } else {
            Role userRole = roleRepository.findByName("CUSTOMER")
                    .orElseThrow(() -> new RuntimeException("Role CUSTOMER không tồn tại trong hệ thống"));

            String displayName = (googleInfo.getName() != null && !googleInfo.getName().isBlank())
                    ? googleInfo.getName()
                    : email.split("@")[0];

            user = User.builder()
                    .fullName(displayName)
                    .email(email)
                    .role(userRole)
                    .authProvider("GOOGLE")
                    .providerId(googleInfo.getSub())
                    .avatarUrl(googleInfo.getPicture())
                    .status("ACTIVE")
                    .passwordHash(null)
                    .build();

            user = userRepository.save(user);
        }

        return generateAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Mã kích hoạt không được để trống");
        }

        UserToken userToken = userTokenRepository.findByTokenAndType(token.trim(), "ACTIVATION")
                .orElseThrow(() -> new ResourceNotFoundException("Liên kết kích hoạt không hợp lệ hoặc đã được sử dụng."));

        if (userToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            userTokenRepository.delete(userToken);
            throw new IllegalArgumentException("Liên kết kích hoạt đã hết hạn. Vui lòng yêu cầu gửi lại email kích hoạt mới.");
        }

        User user = userToken.getUser();
        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            throw new AccessDeniedException("Tài khoản của bạn đã bị khóa bởi quản trị viên.");
        }

        user.setStatus("ACTIVE");
        userRepository.save(user);
        userTokenRepository.delete(userToken);

        return generateAuthResponse(user);
    }

    @Override
    @Transactional
    public void resendActivationEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email không được để trống");
        }

        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email này"));

        if ("ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("Tài khoản này đã được kích hoạt trước đó. Bạn có thể đăng nhập ngay.");
        }

        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            throw new AccessDeniedException("Tài khoản của bạn đã bị khóa bởi quản trị viên.");
        }

        userTokenRepository.deleteByUserIdAndType(user.getId(), "ACTIVATION");

        String activationToken = UUID.randomUUID().toString();
        UserToken userToken = UserToken.builder()
                .user(user)
                .token(activationToken)
                .type("ACTIVATION")
                .expiresAt(LocalDateTime.now().plusHours(24))
                .failedAttempts(0)
                .build();
        userTokenRepository.save(userToken);

        String activationLink = frontendUrl + "/verify-email?token=" + activationToken;
        emailService.sendAccountActivationEmail(user.getEmail(), user.getFullName(), activationLink);
    }

    @Override
    @Transactional
    public void forgotPassword(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email không được để trống");
        }
        String cleanEmail = email.trim().toLowerCase();

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email này"));

        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            throw new AccessDeniedException("Tài khoản của bạn đã bị khóa bởi quản trị viên.");
        }

        if ("UNVERIFIED".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("Tài khoản của bạn chưa được kích hoạt. Vui lòng kiểm tra email kích hoạt tài khoản trước khi đặt lại mật khẩu.");
        }

        // Generate 6-digit OTP using SecureRandom (000000 - 999999)
        int otpNumber = SECURE_RANDOM.nextInt(1_000_000);
        String otp = String.format("%06d", otpNumber);

        // Delete old OTP if exists
        userTokenRepository.deleteByUserIdAndType(user.getId(), "OTP");

        UserToken userToken = UserToken.builder()
                .user(user)
                .token(otp)
                .type("OTP")
                .expiresAt(LocalDateTime.now().plusMinutes(5)) // 5 mins expiry (OWASP recommendation)
                .failedAttempts(0)
                .build();

        userTokenRepository.save(userToken);

        emailService.sendPasswordResetOtp(user.getEmail(), otp);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email này"));

        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            throw new AccessDeniedException("Tài khoản của bạn đã bị khóa bởi quản trị viên.");
        }

        if ("UNVERIFIED".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("Tài khoản của bạn chưa được kích hoạt. Vui lòng kích hoạt tài khoản trước.");
        }

        UserToken userToken = userTokenRepository.findByUserIdAndType(user.getId(), "OTP")
                .orElseThrow(() -> new IllegalArgumentException("Mã OTP không hợp lệ hoặc đã hết hạn"));

        // 1. Kiểm tra hết hạn trước
        if (userToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            userTokenRepository.delete(userToken);
            throw new IllegalArgumentException("Mã OTP đã hết hạn");
        }

        // 2. Kiểm tra số lần đã thử sai trước đó
        int attempts = userToken.getFailedAttempts() != null ? userToken.getFailedAttempts() : 0;
        if (attempts >= 5) {
            userTokenRepository.delete(userToken);
            throw new IllegalArgumentException("Mã OTP đã bị vô hiệu hóa do nhập sai quá 5 lần. Vui lòng yêu cầu mã mới.");
        }

        // 3. Kiểm tra mã OTP
        String submittedOtp = request.getOtp() != null ? request.getOtp().trim() : "";
        if (!userToken.getToken().equals(submittedOtp)) {
            attempts++;
            userToken.setFailedAttempts(attempts);
            if (attempts >= 5) {
                userTokenRepository.delete(userToken);
                throw new IllegalArgumentException("Mã OTP đã bị vô hiệu hóa do nhập sai quá 5 lần. Vui lòng yêu cầu mã mới.");
            }
            userTokenRepository.save(userToken);
            throw new IllegalArgumentException("Mã OTP không chính xác. Bạn còn " + (5 - attempts) + " lần thử.");
        }

        // 4. Đúng OTP: Cập nhật mật khẩu, xóa token OTP và thu hồi toàn bộ Refresh Token cũ
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        userTokenRepository.delete(userToken);
        logoutAllDevices(user.getId());
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        String userEmail = jwtService.extractUsername(refreshToken);
        if (userEmail == null) {
            throw new UnauthorizedException("Refresh token không hợp lệ");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            throw new AccessDeniedException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        UserDetailsImpl userDetails = new UserDetailsImpl(user);

        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new UnauthorizedException("Refresh token đã hết hạn hoặc không hợp lệ");
        }

        // 1. Kiểm tra token có tồn tại trong DB không
        UserToken existingTokenEntity = userTokenRepository.findByTokenAndType(refreshToken, "REFRESH_TOKEN")
                .orElseThrow(() -> new UnauthorizedException("Refresh token không tồn tại hoặc đã bị thu hồi"));

        if (!existingTokenEntity.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Refresh token không hợp lệ");
        }

        // 2. Refresh Token Rotation: Xoay vòng token cho phiên này
        String newJwtToken = jwtService.generateToken(userDetails);
        String newRefreshToken = jwtService.generateRefreshToken(userDetails);

        existingTokenEntity.setToken(newRefreshToken);
        existingTokenEntity.setExpiresAt(LocalDateTime.now().plus(Duration.ofMillis(refreshExpirationMs)));
        userTokenRepository.save(existingTokenEntity);

        return buildAuthResponse(user, newJwtToken, newRefreshToken);
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            userTokenRepository.deleteByToken(refreshToken);
        }
    }

    @Override
    @Transactional
    public void logoutAllDevices(Long userId) {
        userTokenRepository.deleteByUserIdAndType(userId, "REFRESH_TOKEN");
    }

    private AuthResponse generateAuthResponse(User user) {
        // Quản lý số lượng phiên đăng nhập tối đa (FIFO)
        manageActiveSessions(user.getId());

        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        String jwtToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        // Lưu Refresh Token của thiết bị hiện tại mà không xóa các thiết bị khác
        UserToken userToken = UserToken.builder()
                .user(user)
                .token(refreshToken)
                .type("REFRESH_TOKEN")
                .expiresAt(LocalDateTime.now().plus(Duration.ofMillis(refreshExpirationMs)))
                .build();
        userTokenRepository.save(userToken);

        return buildAuthResponse(user, jwtToken, refreshToken);
    }

    private void manageActiveSessions(Long userId) {
        List<UserToken> existingTokens = userTokenRepository.findByUserIdAndTypeOrderByCreatedAtAsc(userId, "REFRESH_TOKEN");
        if (existingTokens.size() >= MAX_ACTIVE_SESSIONS) {
            int toRemove = existingTokens.size() - MAX_ACTIVE_SESSIONS + 1;
            for (int i = 0; i < toRemove; i++) {
                userTokenRepository.delete(existingTokens.get(i));
            }
        }
    }

    private AuthResponse buildAuthResponse(User user, String jwtToken, String refreshToken) {
        List<AddressResponse> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId())
                .stream()
                .map(AddressResponse::fromEntity)
                .toList();

        AddressResponse defaultAddress = addresses.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                .findFirst()
                .orElse(addresses.isEmpty() ? null : addresses.get(0));

        AuthResponse.UserDto userDto = AuthResponse.UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole().getName())
                .avatarUrl(user.getAvatarUrl())
                .authProvider(user.getAuthProvider())
                .status(user.getStatus())
                .defaultAddress(defaultAddress)
                .addresses(addresses)
                .build();

        return AuthResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .user(userDto)
                .build();
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public AuthResponse registerStaff(RegisterRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new ConflictException("Email đã được sử dụng");
        }

        String cleanPhone = request.getPhone() != null ? request.getPhone().trim() : null;
        if (cleanPhone != null && !cleanPhone.isBlank()) {
            if (userRepository.existsByPhoneAndStatus(cleanPhone, "LOCKED")) {
                throw new ConflictException("Số điện thoại này thuộc về tài khoản đã bị khóa.");
            }
            if (userRepository.existsByPhone(cleanPhone)) {
                throw new ConflictException("Số điện thoại này đã được sử dụng cho một tài khoản khác");
            }
        }

        Role userRole = roleRepository.findByName("STAFF")
                .orElseThrow(() -> new RuntimeException("Role STAFF không tồn tại trong hệ thống"));

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(cleanEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(cleanPhone)
                .role(userRole)
                .authProvider("LOCAL")
                .status("ACTIVE")
                .build();

        userRepository.save(user);

        return generateAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse loginStaff(LoginRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        authenticateCredentials(cleanEmail, request.getPassword());

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (!"STAFF".equals(user.getRole().getName())) {
            throw new AccessDeniedException("Tài khoản này không có quyền truy cập của nhân viên");
        }

        if ("LOCKED".equals(user.getStatus())) {
            throw new AccessDeniedException("Tài khoản đã bị khóa");
        }

        return generateAuthResponse(user);
    }
}
