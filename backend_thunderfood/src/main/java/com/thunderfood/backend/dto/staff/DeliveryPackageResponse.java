package com.thunderfood.backend.dto.staff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response trả về thông tin tóm tắt của 1 gói hàng,
 * hiển thị trong màn hình quản lý gói đơn của nhân viên.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryPackageResponse {

    private Long id;
    private String packageName;

    /** Thông tin nhân viên phụ trách giao (null nếu chưa có ai nhận). */
    private Long shippedByStaffId;
    private String shippedByStaffName;

    private int maxOrders;
    private int currentOrderCount;

    /** PENDING / DELIVERING / COMPLETED */
    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    private List<OrderSummaryInPackage> orders;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderSummaryInPackage {
        private Long orderId;
        private String orderCode;
        private String receiverName;
        private String receiverPhone;
        private String shippingAddress;   // địa chỉ đầy đủ (snapshot)
        private String district;          // quận/huyện của ward
        private String wardName;          // phường/xã
        private String detailAddress;     // số nhà / ngõ / đường
        private BigDecimal totalAmount;
        private String status;            // trạng thái từng đơn
        private String paymentMethod;
        private String paymentStatus;
        private LocalDateTime deliveredAt;
    }
}
