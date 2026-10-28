package com.thunderfood.backend.service;

import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;

    // 256-bit base64 secret key
    private final String testSecret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", testSecret);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86400000L); // 1 day
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604800000L); // 7 days

        userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("user@thunderfood.com");
    }

    @Test
    @DisplayName("generateToken tạo token hợp lệ và extractUsername trả về đúng email")
    void testGenerateTokenAndExtractUsername() {
        String token = jwtService.generateToken(userDetails);

        assertNotNull(token);
        assertFalse(token.isBlank());

        String username = jwtService.extractUsername(token);
        assertEquals("user@thunderfood.com", username);
    }

    @Test
    @DisplayName("generateToken với extra claims lưu và trích xuất đúng thông tin")
    void testGenerateTokenWithExtraClaims() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", "CUSTOMER");
        claims.put("userId", 123L);

        String token = jwtService.generateToken(claims, userDetails);
        assertNotNull(token);

        String role = jwtService.extractClaim(token, c -> c.get("role", String.class));
        assertEquals("CUSTOMER", role);
    }

    @Test
    @DisplayName("generateRefreshToken tạo refresh token hợp lệ")
    void testGenerateRefreshToken() {
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        assertNotNull(refreshToken);
        String username = jwtService.extractUsername(refreshToken);
        assertEquals("user@thunderfood.com", username);
    }

    @Test
    @DisplayName("isTokenValid trả về true khi token hợp lệ và khớp user")
    void testIsTokenValid_Success() {
        String token = jwtService.generateToken(userDetails);

        boolean isValid = jwtService.isTokenValid(token, userDetails);
        assertTrue(isValid);
    }

    @Test
    @DisplayName("isTokenValid trả về false khi user khác với subject trong token")
    void testIsTokenValid_WrongUser() {
        String token = jwtService.generateToken(userDetails);

        UserDetails otherUser = mock(UserDetails.class);
        when(otherUser.getUsername()).thenReturn("other@thunderfood.com");

        boolean isValid = jwtService.isTokenValid(token, otherUser);
        assertFalse(isValid);
    }

    @Test
    @DisplayName("Token hết hạn ném ngoại lệ ExpiredJwtException khi truy xuất claim")
    void testExpiredTokenThrowsException() {
        // Cài đặt thời gian hết hạn là -1000ms (đã quá khứ)
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", -1000L);

        String expiredToken = jwtService.generateToken(userDetails);

        assertThrows(ExpiredJwtException.class, () -> {
            jwtService.extractUsername(expiredToken);
        });
    }
}
