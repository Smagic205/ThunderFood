package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.dto.auth.*;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private AuthResponse authResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        AuthResponse.UserDto userDto = AuthResponse.UserDto.builder()
                .id(1L)
                .email("user@gmail.com")
                .fullName("Nguyễn Văn A")
                .role("CUSTOMER")
                .build();

        authResponse = AuthResponse.builder()
                .token("jwt-token-123")
                .refreshToken("refresh-token-123")
                .user(userDto)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/auth/register thành công trả về 200 và AuthResponse")
    void testRegister_Success() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Nguyễn Văn A",
                "user@gmail.com",
                "Pass1234@",
                "0987654321"
        );

        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Đăng ký thành công")))
                .andExpect(jsonPath("$.data.token", is("jwt-token-123")))
                .andExpect(jsonPath("$.data.user.email", is("user@gmail.com")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register trả về 400 khi email không đúng định dạng")
    void testRegister_InvalidEmail_ReturnsBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Nguyễn Văn A",
                "invalid-email-format",
                "Pass1234@",
                "0987654321"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Dữ liệu không hợp lệ")));

        verify(authService, never()).register(any());
    }

    @Test
    @DisplayName("POST /api/v1/auth/register trả về 400 khi mật khẩu không đủ độ dài hoặc thiếu ký tự hoa/đặc biệt")
    void testRegister_InvalidPassword_ReturnsBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Nguyễn Văn A",
                "valid@gmail.com",
                "123", // Quá ngắn
                "0987654321"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        verify(authService, never()).register(any());
    }

    @Test
    @DisplayName("POST /api/v1/auth/login thành công trả về 200 và AuthResponse")
    void testLogin_Success() throws Exception {
        LoginRequest request = new LoginRequest("user@gmail.com", "Pass1234@");

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Đăng nhập thành công")))
                .andExpect(jsonPath("$.data.token", is("jwt-token-123")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login trả về 400 khi để trống email hoặc mật khẩu")
    void testLogin_BlankFields_ReturnsBadRequest() throws Exception {
        LoginRequest request = new LoginRequest("", "");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        verify(authService, never()).login(any());
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh-token thành công trả về 200")
    void testRefreshToken_Success() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("valid-refresh-token");

        when(authService.refreshToken("valid-refresh-token")).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/refresh-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.token", is("jwt-token-123")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout thành công trả về 200")
    void testLogout_Success() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("valid-refresh-token");

        doNothing().when(authService).logout("valid-refresh-token");

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Đăng xuất thành công")));

        verify(authService).logout("valid-refresh-token");
    }

    @Test
    @DisplayName("POST /api/v1/auth/forgot-password thành công trả về 200")
    void testForgotPassword_Success() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("user@gmail.com");

        doNothing().when(authService).forgotPassword("user@gmail.com");

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Mã OTP đã được gửi đến email của bạn")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/reset-password thành công trả về 200")
    void testResetPassword_Success() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("user@gmail.com");
        request.setOtp("123456");
        request.setNewPassword("NewPass123@");

        doNothing().when(authService).resetPassword(any(ResetPasswordRequest.class));

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.")));
    }
}
