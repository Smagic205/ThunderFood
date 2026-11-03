package com.thunderfood.backend.scheduler;

import com.thunderfood.backend.repository.UserTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class TokenCleanupScheduler {

    private final UserTokenRepository userTokenRepository;

    /**
     * Tác vụ tự động dọn dẹp các mã OTP và Refresh Token đã hết hạn.
     * Chạy định kỳ vào lúc 02:00 sáng mỗi ngày.
     */
    @Scheduled(cron = "${app.scheduler.token-cleanup-cron:0 0 2 * * ?}")
    public int cleanupExpiredTokens() {
        log.info("Bắt đầu tiến trình định kỳ dọn dẹp token và OTP đã hết hạn...");
        LocalDateTime now = LocalDateTime.now();
        int deletedCount = userTokenRepository.deleteAllExpiredTokens(now);
        log.info("Dọn dẹp token hoàn tất. Đã xóa {} bản ghi token/OTP hết hạn.", deletedCount);
        return deletedCount;
    }
}

