package com.thunderfood.backend.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.thunderfood.backend.dto.auth.LoginRequest;
import com.thunderfood.backend.dto.auth.RefreshTokenRequest;
import com.thunderfood.backend.dto.auth.RegisterRequest;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.entity.UserToken;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthAndSecurityIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("IT-01: Luồng Đăng ký (BCrypt), Kích hoạt Email, Đăng nhập JWT, Kiểm tra RBAC & Đăng xuất")
    void registerVerifyLoginAuthorizeAndLogoutFlow() throws Exception {
        // 1. Đăng ký tài khoản mới -> lưu DB với mật khẩu mã hóa BCrypt và trạng thái UNVERIFIED
        RegisterRequest registerReq = new RegisterRequest(
                "Nguyễn Minh Quân",
                "quan.it01@gmail.com",
                "StrongPass1@",
                "0912345678"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.requiresVerification", is(true)));

        verify(emailService).sendAccountActivationEmail(anyString(), anyString(), anyString());

        User registered = userRepository.findByEmail("quan.it01@gmail.com").orElseThrow();
        assertThat(registered.getStatus()).isEqualTo("UNVERIFIED");
        assertThat(registered.getPasswordHash()).isNotEqualTo("StrongPass1@");
        assertThat(passwordEncoder.matches("StrongPass1@", registered.getPasswordHash())).isTrue();

        // 2. Chưa kích hoạt thì đăng nhập bị từ chối (403 Forbidden kèm thông báo kích hoạt)
        LoginRequest loginReq = new LoginRequest("quan.it01@gmail.com", "StrongPass1@");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("chưa được kích hoạt")));

        // 3. Kích hoạt email bằng token lưu trong DB -> chuyển sang ACTIVE
        UserToken activationToken = userTokenRepository.findByUserIdAndType(registered.getId(), "ACTIVATION")
                .orElseThrow();

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .param("token", activationToken.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        User activated = userRepository.findById(registered.getId()).orElseThrow();
        assertThat(activated.getStatus()).isEqualTo("ACTIVE");

        // 4. Đăng nhập lấy Access Token + Refresh Token
        MvcResult loginRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.role", is("CUSTOMER")))
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginRes.getResponse().getContentAsString());
        String customerToken = loginJson.path("data").path("token").asText();
        String refreshToken = loginJson.path("data").path("refreshToken").asText();
        assertThat(customerToken).isNotBlank();
        assertThat(userTokenRepository.findByTokenAndType(refreshToken, "REFRESH_TOKEN")).isPresent();

        // 5. Kiểm tra bảo vệ Spring Security:
        // - Chưa có token vào giỏ hàng -> 401 Unauthorized
        mockMvc.perform(get("/api/v1/cart"))
                .andExpect(status().isUnauthorized());

        // - CUSTOMER gọi API Admin Dashboard -> 403 Forbidden
        mockMvc.perform(get("/api/v1/admin/dashboard/summary")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        // - ADMIN gọi API Admin Dashboard -> 200 OK
        createUser("admin.it01@thunderfood.vn", "Admin IT", "AdminPass1@", "0988776655", "ADMIN", "ACTIVE");
        String adminToken = loginAndGetAccessToken("admin.it01@thunderfood.vn", "AdminPass1@");

        mockMvc.perform(get("/api/v1/admin/dashboard/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 6. Đăng xuất -> thu hồi Refresh Token trong DB
        RefreshTokenRequest logoutReq = new RefreshTokenRequest();
        logoutReq.setRefreshToken(refreshToken);
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutReq)))
                .andExpect(status().isOk());

        assertThat(userTokenRepository.findByTokenAndType(refreshToken, "REFRESH_TOKEN")).isEmpty();

        // Thử dùng lại Refresh Token đã logout -> thất bại (401/400)
        mockMvc.perform(post("/api/v1/auth/refresh-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutReq)))
                .andExpect(status().is4xxClientError());
    }
}
