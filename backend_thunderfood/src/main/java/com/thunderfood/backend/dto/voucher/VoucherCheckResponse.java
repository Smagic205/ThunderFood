package com.thunderfood.backend.dto.voucher;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherCheckResponse {

    private boolean valid;
    private String message;
    private String voucherType;
    private BigDecimal discountAmount;
    private BigDecimal finalSubtotal;
    private BigDecimal finalShippingFee;
    private VoucherClientResponse voucher;
}
