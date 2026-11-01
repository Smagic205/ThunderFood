package com.thunderfood.backend.dto.voucher;

import com.thunderfood.backend.entity.Voucher;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherAdminResponse {

    private Long id;
    private String code;
    private String name;
    private String description;
    private String voucherType;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountAmount;
    private Integer usageLimit;
    private Integer usageLimitPerUser;
    private Integer usedCount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
    private String status; // ACTIVE, UPCOMING, EXPIRED, DEPLETED, INACTIVE
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VoucherAdminResponse fromEntity(Voucher voucher) {
        if (voucher == null) {
            return null;
        }
        LocalDateTime now = LocalDateTime.now();
        return VoucherAdminResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .name(voucher.getName())
                .description(voucher.getDescription())
                .voucherType(voucher.getVoucherType())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .minOrderAmount(voucher.getMinOrderAmount())
                .maxDiscountAmount(voucher.getMaxDiscountAmount())
                .usageLimit(voucher.getUsageLimit())
                .usageLimitPerUser(voucher.getUsageLimitPerUser())
                .usedCount(voucher.getUsedCount())
                .startDate(voucher.getStartDate())
                .endDate(voucher.getEndDate())
                .isActive(voucher.getIsActive())
                .status(voucher.computeStatus(now))
                .createdAt(voucher.getCreatedAt())
                .updatedAt(voucher.getUpdatedAt())
                .build();
    }
}
