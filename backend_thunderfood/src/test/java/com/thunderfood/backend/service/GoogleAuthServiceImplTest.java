package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.auth.GoogleUserInfo;
import com.thunderfood.backend.exception.UnauthorizedException;
import com.thunderfood.backend.service.impl.GoogleAuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GoogleAuthServiceImplTest {

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<String> httpResponse;

    private GoogleAuthServiceImpl googleAuthService;

    @BeforeEach
    void setUp() {
        googleAuthService = new GoogleAuthServiceImpl(httpClient);
        ReflectionTestUtils.setField(googleAuthService, "expectedClientId", "test-client-id.apps.googleusercontent.com");
    }

    @Test
    @DisplayName("Ném UnauthorizedException khi idToken null")
    void testVerifyToken_NullToken() {
        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> googleAuthService.verifyToken(null));
        assertTrue(ex.getMessage().contains("không được để trống"));
        verifyNoInteractions(httpClient);
    }

    @Test
    @DisplayName("Ném UnauthorizedException khi idToken rỗng")
    void testVerifyToken_BlankToken() {
        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> googleAuthService.verifyToken("   "));
        assertTrue(ex.getMessage().contains("không được để trống"));
        verifyNoInteractions(httpClient);
    }

    @Test
    @DisplayName("verifyToken thành công khi Google trả 200 và đúng audience/email_verified (mock HTTP)")
    @SuppressWarnings("unchecked")
    void testVerifyToken_ValidToken() throws Exception {
        String body = """
                {
                  "sub": "google-sub-123",
                  "email": "user@gmail.com",
                  "email_verified": "true",
                  "aud": "test-client-id.apps.googleusercontent.com",
                  "name": "Nguyễn Văn A",
                  "picture": "https://lh3.googleusercontent.com/avatar.png"
                }
                """;
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(body);
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(httpResponse);

        GoogleUserInfo info = googleAuthService.verifyToken("valid-token");

        assertNotNull(info);
        assertEquals("google-sub-123", info.getSub());
        assertEquals("user@gmail.com", info.getEmail());
        assertTrue(info.isEmailVerified());
    }

    @Test
    @DisplayName("Ném UnauthorizedException khi Google tokeninfo trả về lỗi 400 (mock HTTP, không gọi mạng thật)")
    @SuppressWarnings("unchecked")
    void testVerifyToken_InvalidToken() throws Exception {
        when(httpResponse.statusCode()).thenReturn(400);
        when(httpResponse.body()).thenReturn("{\"error\":\"invalid_token\"}");
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(httpResponse);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> googleAuthService.verifyToken("invalid-dummy-token"));
        assertTrue(ex.getMessage().contains("thất bại"));
    }

    @Test
    @DisplayName("Từ chối đăng nhập Google nếu GOOGLE_CLIENT_ID bị rỗng")
    @SuppressWarnings("unchecked")
    void testVerifyToken_BlankClientId_ThrowsUnauthorized() throws Exception {
        ReflectionTestUtils.setField(googleAuthService, "expectedClientId", "");
        String body = """
                {
                  "sub": "google-sub-123",
                  "email": "user@gmail.com",
                  "email_verified": "true",
                  "aud": "any-client-id"
                }
                """;
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(body);
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(httpResponse);

        assertThrows(UnauthorizedException.class, () -> googleAuthService.verifyToken("some-token"));
    }
}
