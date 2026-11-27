package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.AuthCookieService;
import com.thunderfood.backend.config.security.DynamicCookieCsrfTokenRepository;
import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.auth.AuthResponse;
import com.thunderfood.backend.dto.auth.ForgotPasswordRequest;
import com.thunderfood.backend.dto.auth.GoogleAuthRequest;
import com.thunderfood.backend.dto.auth.LoginRequest;
import com.thunderfood.backend.dto.auth.RefreshTokenRequest;
import com.thunderfood.backend.dto.auth.RegisterRequest;
import com.thunderfood.backend.dto.auth.ResendActivationRequest;
import com.thunderfood.backend.dto.auth.ResetPasswordRequest;
import com.thunderfood.backend.exception.UnauthorizedException;
import com.thunderfood.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService authCookieService;

    @GetMapping("/csrf")
    public ResponseEntity<ApiResponse<Map<String, String>>> getCsrfToken(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        Object attr = httpRequest.getAttribute(CsrfToken.class.getName());
        if (!(attr instanceof CsrfToken)) {
            attr = httpRequest.getAttribute(DynamicCookieCsrfTokenRepository.CSRF_PARAMETER_NAME);
        }
        CsrfToken csrfToken = attr instanceof CsrfToken ? (CsrfToken) attr : null;

        String tokenValue = csrfToken != null ? csrfToken.getToken() : "";
        String headerName = csrfToken != null
                ? csrfToken.getHeaderName()
                : DynamicCookieCsrfTokenRepository.CSRF_HEADER_NAME;

        if (!tokenValue.isBlank()) {
            httpResponse.setHeader(DynamicCookieCsrfTokenRepository.CSRF_RESPONSE_HEADER_NAME, tokenValue);
        }

        return ResponseEntity.ok(ApiResponse.success(
                "CSRF token ready",
                Map.of("token", tokenValue, "headerName", headerName)
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        AuthResponse response = authService.register(request);
        attachRefreshCookieAndSanitizeBody(httpRequest, httpResponse, response, true);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký thành công", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        AuthResponse response = authService.login(request);
        boolean persistent = !Boolean.FALSE.equals(request.getRememberMe());
        attachRefreshCookieAndSanitizeBody(httpRequest, httpResponse, response, persistent);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithGoogle(
            @Valid @RequestBody GoogleAuthRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        AuthResponse response = authService.loginWithGoogle(request);
        attachRefreshCookieAndSanitizeBody(httpRequest, httpResponse, response, true);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập Google thành công", response));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmail(
            @RequestParam("token") String token,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        AuthResponse response = authService.verifyEmail(token);
        attachRefreshCookieAndSanitizeBody(httpRequest, httpResponse, response, true);
        return ResponseEntity.ok(ApiResponse.success("Kích hoạt tài khoản thành công!", response));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmailGet(
            @RequestParam("token") String token,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        AuthResponse response = authService.verifyEmail(token);
        attachRefreshCookieAndSanitizeBody(httpRequest, httpResponse, response, true);
        return ResponseEntity.ok(ApiResponse.success("Kích hoạt tài khoản thành công!", response));
    }

    @PostMapping("/resend-activation")
    public ResponseEntity<ApiResponse<String>> resendActivation(
            @Valid @RequestBody ResendActivationRequest request
    ) {
        authService.resendActivationEmail(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Email kích hoạt mới đã được gửi. Vui lòng kiểm tra hòm thư của bạn.", null));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @RequestBody(required = false) RefreshTokenRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String refreshToken = resolveRefreshToken(httpRequest, request);
        if (refreshToken == null) {
            authCookieService.clearRefreshTokenCookie(httpRequest, httpResponse);
            throw new UnauthorizedException("Refresh token không tồn tại hoặc đã hết hạn");
        }

        try {
            AuthResponse response = authService.refreshToken(refreshToken);
            boolean persistent = request == null || !Boolean.FALSE.equals(request.getRememberMe());
            attachRefreshCookieAndSanitizeBody(httpRequest, httpResponse, response, persistent);
            return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công", response));
        } catch (UnauthorizedException | AccessDeniedException ex) {
            authCookieService.clearRefreshTokenCookie(httpRequest, httpResponse);
            throw ex;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(
            @RequestBody(required = false) RefreshTokenRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String refreshToken = resolveRefreshToken(httpRequest, request);
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }
        authCookieService.clearRefreshTokenCookie(httpRequest, httpResponse);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Mã OTP đã được gửi đến email của bạn", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.", null));
    }

    @PostMapping("/staff/register")
    public ResponseEntity<ApiResponse<AuthResponse>> registerStaff(
            @Valid @RequestBody RegisterRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Đăng ký tài khoản nhân viên thành công", authService.registerStaff(request)));
    }

    @PostMapping("/staff/login")
    public ResponseEntity<ApiResponse<AuthResponse>> loginStaff(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        AuthResponse response = authService.loginStaff(request);
        boolean persistent = !Boolean.FALSE.equals(request.getRememberMe());
        attachRefreshCookieAndSanitizeBody(httpRequest, httpResponse, response, persistent);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập nhân viên thành công", response));
    }

    private String resolveRefreshToken(HttpServletRequest httpRequest, RefreshTokenRequest body) {
        String cookieToken = authCookieService.extractRefreshTokenFromCookie(httpRequest);
        if (cookieToken != null && !cookieToken.isBlank()) {
            return cookieToken;
        }
        if (body != null && body.getRefreshToken() != null && !body.getRefreshToken().isBlank()) {
            return body.getRefreshToken().trim();
        }
        return null;
    }

    private void attachRefreshCookieAndSanitizeBody(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse,
            AuthResponse response,
            boolean persistent
    ) {
        if (response == null || response.getRefreshToken() == null || response.getRefreshToken().isBlank()) {
            return;
        }
        authCookieService.addRefreshTokenCookie(httpRequest, httpResponse, response.getRefreshToken(), persistent);
        if (!authCookieService.isExposeRefreshTokenInBody()) {
            response.setRefreshToken(null);
        }
    }
}
