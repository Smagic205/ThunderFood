package com.thunderfood.backend.dto.voucher;

import com.thunderfood.backend.entity.Voucher;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherClientResponse {

    private Long id;
    private String code;
    private String name;
    private String description;
    private String voucherType;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountAmount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer remainingUses;
    private boolean eligible;
    private String ineligibleReason;

    public static VoucherClientResponse fromEntity(Voucher voucher, boolean eligible, String ineligibleReason) {
        if (voucher == null) {
            return null;
        }
        Integer remaining = null;
        if (voucher.getUsageLimit() != null) {
            remaining = Math.max(0, voucher.getUsageLimit() - (voucher.getUsedCount() != null ? voucher.getUsedCount() : 0));
        }
        return VoucherClientResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .name(voucher.getName())
                .description(voucher.getDescription())
                .voucherType(voucher.getVoucherType())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .minOrderAmount(voucher.getMinOrderAmount())
                .maxDiscountAmount(voucher.getMaxDiscountAmount())
                .startDate(voucher.getStartDate())
                .endDate(voucher.getEndDate())
                .remainingUses(remaining)
                .eligible(eligible)
                .ineligibleReason(ineligibleReason)
                .build();
    }
}
