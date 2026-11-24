package com.thunderfood.backend.service;

import com.thunderfood.backend.exception.UnauthorizedException;
import com.thunderfood.backend.service.impl.GoogleAuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class GoogleAuthServiceImplTest {

    private GoogleAuthServiceImpl googleAuthService;

    @BeforeEach
    void setUp() {
        googleAuthService = new GoogleAuthServiceImpl();
        ReflectionTestUtils.setField(googleAuthService, "expectedClientId", "test-client-id.apps.googleusercontent.com");
    }

    @Test
    @DisplayName("Ném UnauthorizedException khi idToken null")
    void testVerifyToken_NullToken() {
        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> googleAuthService.verifyToken(null));
        assertTrue(ex.getMessage().contains("không được để trống"));
    }

    @Test
    @DisplayName("Ném UnauthorizedException khi idToken rỗng")
    void testVerifyToken_BlankToken() {
        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> googleAuthService.verifyToken("   "));
        assertTrue(ex.getMessage().contains("không được để trống"));
    }

    @Test
    @DisplayName("Ném UnauthorizedException khi idToken không hợp lệ (không kết nối được hoặc Google trả lỗi)")
    void testVerifyToken_InvalidToken() {
        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> googleAuthService.verifyToken("invalid-dummy-token"));
        assertNotNull(ex.getMessage());
    }
}
