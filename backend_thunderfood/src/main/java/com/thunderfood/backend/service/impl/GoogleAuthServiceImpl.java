package com.thunderfood.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.dto.auth.GoogleUserInfo;
import com.thunderfood.backend.exception.UnauthorizedException;
import com.thunderfood.backend.service.GoogleAuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Slf4j
@Service
public class GoogleAuthServiceImpl implements GoogleAuthService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;

    @Value("${app.google.client-id:}")
    private String expectedClientId;

    @Autowired
    public GoogleAuthServiceImpl() {
        this(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build());
    }

    public GoogleAuthServiceImpl(HttpClient httpClient) {
        this.httpClient = httpClient;
    }

    @Override
    public GoogleUserInfo verifyToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new UnauthorizedException("Google ID Token không được để trống");
        }

        try {
            String encodedToken = URLEncoder.encode(idToken.trim(), StandardCharsets.UTF_8);
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodedToken;

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (httpResponse.statusCode() != 200) {
                log.warn("Google token verification failed with status {}: {}", httpResponse.statusCode(), httpResponse.body());
                throw new UnauthorizedException("Xác thực token Google thất bại. Token không hợp lệ hoặc đã hết hạn.");
            }

            JsonNode root = objectMapper.readTree(httpResponse.body());

            String email = root.has("email") ? root.get("email").asText() : null;
            if (email == null || email.isBlank()) {
                throw new UnauthorizedException("Không tìm thấy thông tin email từ tài khoản Google");
            }

            String emailVerifiedStr = root.has("email_verified") ? root.get("email_verified").asText() : "false";
            boolean emailVerified = Boolean.parseBoolean(emailVerifiedStr);
            if (!emailVerified) {
                throw new UnauthorizedException("Email tài khoản Google này chưa được Google xác thực.");
            }

            // Bắt buộc cấu hình GOOGLE_CLIENT_ID và kiểm tra audience (aud) khớp với hệ thống
            if (expectedClientId == null || expectedClientId.isBlank()) {
                log.error("GOOGLE_CLIENT_ID chưa được cấu hình, từ chối xác thực Google ID Token.");
                throw new UnauthorizedException("Đăng nhập Google chưa được cấu hình trên hệ thống.");
            }
            String aud = root.has("aud") ? root.get("aud").asText() : "";
            if (!expectedClientId.trim().equals(aud)) {
                log.warn("Google token aud mismatch: expected {}, got {}", expectedClientId, aud);
                throw new UnauthorizedException("Client ID của token Google không khớp với hệ thống");
            }

            String sub = root.has("sub") ? root.get("sub").asText() : null;
            String name = root.has("name") ? root.get("name").asText() : email.split("@")[0];
            String picture = root.has("picture") ? root.get("picture").asText() : null;

            return GoogleUserInfo.builder()
                    .sub(sub)
                    .email(email)
                    .name(name)
                    .picture(picture)
                    .emailVerified(emailVerified)
                    .build();

        } catch (UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error verifying Google ID token: ", e);
            throw new UnauthorizedException("Không thể kết nối đến máy chủ Google để xác thực: " + e.getMessage());
        }
    }
}
