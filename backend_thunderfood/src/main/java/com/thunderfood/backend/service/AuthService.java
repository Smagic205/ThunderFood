package com.thunderfood.backend.service;

import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.auth.AuthResponse;
import com.thunderfood.backend.dto.auth.LoginRequest;
import com.thunderfood.backend.dto.auth.RegisterRequest;
import com.thunderfood.backend.dto.auth.ResetPasswordRequest;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.entity.UserToken;
import com.thunderfood.backend.repository.RoleRepository;
import com.thunderfood.backend.repository.UserRepository;
import com.thunderfood.backend.repository.UserTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserTokenRepository userTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng");
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

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if ("LOCKED".equals(user.getStatus())) {
            throw new RuntimeException("Tài khoản đã bị khóa");
        }

        return generateAuthResponse(user);
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này"));

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Delete old OTP if exists
        userTokenRepository.deleteByUserIdAndType(user.getId(), "OTP");

        UserToken userToken = UserToken.builder()
                .user(user)
                .token(otp)
                .type("OTP")
                .expiresAt(LocalDateTime.now().plusMinutes(15)) // 15 mins expiry
                .build();

        userTokenRepository.save(userToken);

        emailService.sendPasswordResetOtp(email, otp);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này"));

        UserToken userToken = userTokenRepository.findByUserIdAndType(user.getId(), "OTP")
                .orElseThrow(() -> new RuntimeException("Mã OTP không hợp lệ hoặc đã hết hạn"));

        if (!userToken.getToken().equals(request.getOtp())) {
            throw new RuntimeException("Mã OTP không chính xác");
        }

        if (userToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            userTokenRepository.delete(userToken);
            throw new RuntimeException("Mã OTP đã hết hạn");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Delete OTP after successful reset
        userTokenRepository.delete(userToken);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        String userEmail = jwtService.extractUsername(refreshToken);
        if (userEmail == null) {
            throw new RuntimeException("Refresh token không hợp lệ");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        UserDetailsImpl userDetails = new UserDetailsImpl(user);

        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new RuntimeException("Refresh token đã hết hạn hoặc không hợp lệ");
        }

        // Verify token exists in DB (prevents use of revoked tokens)
        userTokenRepository.findByUserIdAndType(user.getId(), "REFRESH_TOKEN")
                .filter(t -> t.getToken().equals(refreshToken))
                .orElseThrow(() -> new RuntimeException("Refresh token không tồn tại hoặc đã bị thu hồi"));

        return generateAuthResponse(user);
    }

    private AuthResponse generateAuthResponse(User user) {
        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        String jwtToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        // Save refresh token to DB
        userTokenRepository.deleteByUserIdAndType(user.getId(), "REFRESH_TOKEN");
        UserToken userToken = UserToken.builder()
                .user(user)
                .token(refreshToken)
                .type("REFRESH_TOKEN")
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        userTokenRepository.save(userToken);

        AuthResponse.UserDto userDto = AuthResponse.UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .avatarUrl(user.getAvatarUrl())
                .build();

        return AuthResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .user(userDto)
                .build();
    }
}
