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
public class AdminPackageResponse {
    private Long id;
    private String code;
    private String status; // UNASSIGNED, DELIVERING, COMPLETED
    private Long staffId;
    private String staffName;
    private List<String> orderCodes;
    private List<PackageOrderItemDto> orders;
    private String createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PackageOrderItemDto {
        private String orderCode;
        private String receiverName;
        private String receiverPhone;
        private String shippingAddress;
        private BigDecimal totalAmount;
        private String status;
    }
}
