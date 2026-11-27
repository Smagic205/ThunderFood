package com.thunderfood.backend.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.thunderfood.backend.dto.auth.LoginRequest;
import com.thunderfood.backend.dto.auth.RegisterRequest;
import com.thunderfood.backend.dto.user.UpdateCustomerProfileRequest;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.entity.UserToken;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthAndSecurityIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("IT-01: Đăng ký, Kích hoạt Email, Đăng nhập HttpOnly Cookie + CSRF Refresh Rotation, RBAC & Đăng xuất")
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
                .andExpect(jsonPath("$.message").value(containsString("chưa được kích hoạt")));

        // 3. Kích hoạt email bằng token lưu trong DB -> chuyển sang ACTIVE
        UserToken activationToken = userTokenRepository.findByUserIdAndType(registered.getId(), "ACTIVATION")
                .orElseThrow();

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .param("token", activationToken.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        User activated = userRepository.findById(registered.getId()).orElseThrow();
        assertThat(activated.getStatus()).isEqualTo("ACTIVE");

        // 4. Đăng nhập: trả Access Token trong body và đặt Refresh Token trong HttpOnly Cookie (không lộ refreshToken ở JSON)
        MvcResult loginRes = mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-Proto", "https")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.role", is("CUSTOMER")))
                .andExpect(jsonPath("$.data.refreshToken").doesNotExist())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("HttpOnly")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("SameSite=None")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Secure")))
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginRes.getResponse().getContentAsString());
        String customerToken = loginJson.path("data").path("token").asText();
        Cookie refreshCookie = loginRes.getResponse().getCookie("tf_refresh_token");
        assertThat(customerToken).isNotBlank();
        assertThat(refreshCookie).isNotNull();
        assertThat(refreshCookie.isHttpOnly()).isTrue();
        assertThat(userTokenRepository.findByTokenAndType(refreshCookie.getValue(), "REFRESH_TOKEN")).isPresent();

        // 5. Kiểm tra bảo vệ Spring Security RBAC:
        mockMvc.perform(get("/api/v1/cart"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/dashboard/summary")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        createUser("admin.it01@thunderfood.vn", "Admin IT", "AdminPass1@", "0988776655", "ADMIN", "ACTIVE");
        String adminToken = loginAndGetAccessToken("admin.it01@thunderfood.vn", "AdminPass1@");

        mockMvc.perform(get("/api/v1/admin/dashboard/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 6. Chống CSRF: gọi /refresh-token bằng Cookie nhưng thiếu X-XSRF-TOKEN phải bị chặn 403 CSRF_INVALID
        mockMvc.perform(post("/api/v1/auth/refresh-token")
                        .header("Origin", "https://thunderfoods.vercel.app")
                        .cookie(refreshCookie))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data", is("CSRF_INVALID")));

        // 7. Lấy CSRF token qua /api/v1/auth/csrf và thực hiện xoay vòng Refresh Token qua HttpOnly Cookie
        MvcResult csrfRes = mockMvc.perform(get("/api/v1/auth/csrf")
                        .header("Origin", "https://thunderfoods.vercel.app"))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andReturn();

        Cookie xsrfCookie = csrfRes.getResponse().getCookie("XSRF-TOKEN");
        String csrfHeaderValue = csrfRes.getResponse().getHeader("X-CSRF-TOKEN");
        assertThat(xsrfCookie).isNotNull();
        assertThat(csrfHeaderValue).isNotBlank();

        MvcResult refreshRes = mockMvc.perform(post("/api/v1/auth/refresh-token")
                        .header("Origin", "https://thunderfoods.vercel.app")
                        .header("X-XSRF-TOKEN", csrfHeaderValue)
                        .cookie(refreshCookie, xsrfCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.refreshToken").doesNotExist())
                .andReturn();

        Cookie rotatedRefreshCookie = refreshRes.getResponse().getCookie("tf_refresh_token");
        assertThat(rotatedRefreshCookie).isNotNull();
        assertThat(rotatedRefreshCookie.getValue()).isNotEqualTo(refreshCookie.getValue());
        assertThat(userTokenRepository.findByTokenAndType(rotatedRefreshCookie.getValue(), "REFRESH_TOKEN")).isPresent();

        // 8. Đăng xuất bằng Cookie + CSRF -> thu hồi Refresh Token trong DB và xóa Cookie
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + customerToken)
                        .header("Origin", "https://thunderfoods.vercel.app")
                        .header("X-XSRF-TOKEN", csrfHeaderValue)
                        .cookie(rotatedRefreshCookie, xsrfCookie))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge("tf_refresh_token", 0));

        assertThat(userTokenRepository.findByTokenAndType(rotatedRefreshCookie.getValue(), "REFRESH_TOKEN")).isEmpty();

        // Thử dùng lại Refresh Token đã logout -> thất bại 401
        mockMvc.perform(post("/api/v1/auth/refresh-token")
                        .header("Origin", "https://thunderfoods.vercel.app")
                        .header("X-XSRF-TOKEN", csrfHeaderValue)
                        .cookie(rotatedRefreshCookie, xsrfCookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("IT-02: CORS chỉ cho phép origin frontend hợp lệ và từ chối origin lạ")
    void corsWhitelistAllowsTrustedOriginsAndRejectsUnknownOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/auth/login")
                        .header("Origin", "https://thunderfoods.vercel.app")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Content-Type,X-XSRF-TOKEN"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://thunderfoods.vercel.app"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));

        mockMvc.perform(options("/api/v1/auth/login")
                        .header("Origin", "https://evil-attacker.example.com")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    @DisplayName("IT-03: Chặn URL XSS (javascript:) ở đầu vào API cập nhật hồ sơ")
    void blocksUnsafeJavascriptUrlOnProfileUpdate() throws Exception {
        createUser("xss.user@gmail.com", "Khách XSS", "StrongPass1@", "0912345679", "CUSTOMER", "ACTIVE");
        String token = loginAndGetAccessToken("xss.user@gmail.com", "StrongPass1@");

        UpdateCustomerProfileRequest payload = UpdateCustomerProfileRequest.builder()
                .fullName("Khách An Toàn")
                .phone("0912345679")
                .avatarUrl("javascript:alert(1)")
                .build();

        mockMvc.perform(put("/api/v1/users/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Dữ liệu không hợp lệ")));
    }
}
