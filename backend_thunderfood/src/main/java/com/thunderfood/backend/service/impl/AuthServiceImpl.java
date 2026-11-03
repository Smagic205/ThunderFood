package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.address.AddressResponse;
import com.thunderfood.backend.dto.auth.AuthResponse;
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
import com.thunderfood.backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

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

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email đã được sử dụng");
        }

        Role userRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new RuntimeException("Role CUSTOMER không tồn tại trong hệ thống"));

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(userRole)
                .authProvider("LOCAL")
                .status("ACTIVE")
                .build();

        userRepository.save(user);

        return generateAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if ("LOCKED".equals(user.getStatus())) {
            throw new AccessDeniedException("Tài khoản đã bị khóa");
        }

        return generateAuthResponse(user);
    }

    @Override
    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email này"));

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

        emailService.sendPasswordResetOtp(email, otp);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email này"));

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
        if (!userToken.getToken().equals(request.getOtp())) {
            attempts++;
            userToken.setFailedAttempts(attempts);
            if (attempts >= 5) {
                userTokenRepository.delete(userToken);
                throw new IllegalArgumentException("Mã OTP đã bị vô hiệu hóa do nhập sai quá 5 lần. Vui lòng yêu cầu mã mới.");
            }
            userTokenRepository.save(userToken);
            throw new IllegalArgumentException("Mã OTP không chính xác. Bạn còn " + (5 - attempts) + " lần thử.");
        }

        // 4. Đúng OTP: Cập nhật mật khẩu và xóa token
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Delete OTP after successful reset
        userTokenRepository.delete(userToken);
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
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email đã được sử dụng");
        }

        Role userRole = roleRepository.findByName("STAFF")
                .orElseThrow(() -> new RuntimeException("Role STAFF không tồn tại trong hệ thống"));

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
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
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
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
