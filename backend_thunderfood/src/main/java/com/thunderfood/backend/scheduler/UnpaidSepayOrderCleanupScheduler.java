package com.thunderfood.backend.scheduler;

import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class UnpaidSepayOrderCleanupScheduler {

    private final OrderRepository orderRepository;
    private final UnpaidSepayOrderCleanupService cleanupService;

    @Value("${sepay.unpaid-expiration-minutes:15}")
    private long unpaidExpirationMinutes = 15L;

    /**
     * Quét định kỳ các đơn SEPAY treo trạng thái UNPAID & PENDING quá thời hạn thanh toán
     * để tự động hủy, hoàn tồn kho và hoàn lượt voucher.
     */
    @Scheduled(fixedDelayString = "${app.scheduler.sepay-unpaid-check-ms:60000}")
    public int cancelExpiredUnpaidOrders() {
        if (unpaidExpirationMinutes <= 0) {
            return 0;
        }

        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(unpaidExpirationMinutes);
        List<Order> expiredOrders = orderRepository
                .findByPaymentMethodAndPaymentStatusAndStatusAndCreatedAtBefore("SEPAY", "UNPAID", "PENDING", cutoff);

        if (expiredOrders.isEmpty()) {
            return 0;
        }

        int cancelledCount = 0;
        for (Order expiredOrder : expiredOrders) {
            try {
                if (cleanupService.cancelExpiredUnpaidOrder(expiredOrder.getId(), unpaidExpirationMinutes)) {
                    cancelledCount++;
                }
            } catch (Exception ex) {
                log.error("Lỗi khi tự động hủy đơn SEPAY quá hạn orderId={}: {}", expiredOrder.getId(), ex.getMessage(), ex);
            }
        }

        if (cancelledCount > 0) {
            log.info("Hoàn tất quét đơn SEPAY quá hạn (> {} phút): đã hủy & hoàn kho {} đơn.",
                    unpaidExpirationMinutes, cancelledCount);
        }
        return cancelledCount;
    }
}
