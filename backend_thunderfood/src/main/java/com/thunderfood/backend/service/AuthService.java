package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.auth.AuthResponse;
import com.thunderfood.backend.dto.auth.LoginRequest;
import com.thunderfood.backend.dto.auth.RegisterRequest;
import com.thunderfood.backend.dto.auth.ResetPasswordRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    void forgotPassword(String email);

    void resetPassword(ResetPasswordRequest request);

    AuthResponse refreshToken(String refreshToken);

    void logout(String refreshToken);

    void logoutAllDevices(Long userId);

    AuthResponse registerStaff(RegisterRequest request);

    AuthResponse loginStaff(LoginRequest request);
}
