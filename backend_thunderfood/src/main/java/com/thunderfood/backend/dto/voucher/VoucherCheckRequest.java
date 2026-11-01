package com.thunderfood.backend.dto.voucher;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherCheckRequest {

    @NotBlank(message = "Mã voucher không được để trống")
    private String code;

    @Builder.Default
    @DecimalMin(value = "0.00", message = "Tiền đơn hàng không thể âm")
    private BigDecimal subtotalAmount = BigDecimal.ZERO;

    @Builder.Default
    @DecimalMin(value = "0.00", message = "Phí vận chuyển không thể âm")
    private BigDecimal shippingFee = BigDecimal.ZERO;
}
