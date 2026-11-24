package com.thunderfood.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderResponse {
    private Long id;
    private String orderCode;
    private Long userId;
    private String customer;
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private List<OrderItemDto> items;
    private Integer itemCount;
    private String voucherProduct;
    private String voucherShipping;
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal discountShippingAmount;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;
    private String status;
    private String paymentMethod;
    private String paymentStatus;
    private String note;
    private String createdAt;
    private List<OrderHistoryDto> history;
    private PackageInfoDto packageInfo;
    private String txn;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemDto {
        private Long productId;
        private String productName;
        private BigDecimal productPrice;
        private Integer quantity;
        private BigDecimal lineTotal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderHistoryDto {
        private String status;
        private String createdAt;
        private String note;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PackageInfoDto {
        private Long id;
        private String code;
        private String status;
        private Long staffId;
        private String staffName;
    }
}
