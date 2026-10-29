package com.thunderfood.backend.service;

import com.thunderfood.backend.repository.UserTokenRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenCleanupSchedulerTest {

    @Mock
    private UserTokenRepository userTokenRepository;

    @InjectMocks
    private TokenCleanupScheduler tokenCleanupScheduler;

    @Test
    @DisplayName("Tác vụ định kỳ gọi deleteAllExpiredTokens và xóa đúng số lượng bản ghi hết hạn")
    void testCleanupExpiredTokens_Success() {
        when(userTokenRepository.deleteAllExpiredTokens(any(LocalDateTime.class))).thenReturn(15);

        int deletedCount = tokenCleanupScheduler.cleanupExpiredTokens();

        assertEquals(15, deletedCount);
        verify(userTokenRepository).deleteAllExpiredTokens(any(LocalDateTime.class));
    }
}
