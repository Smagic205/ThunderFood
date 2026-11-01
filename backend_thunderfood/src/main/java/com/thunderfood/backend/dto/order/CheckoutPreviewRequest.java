package com.thunderfood.backend.dto.order;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutPreviewRequest {

    @NotNull(message = "Vui lòng chọn địa chỉ giao hàng")
    private Long addressId;

    private String productVoucherCode;

    private String shippingVoucherCode;
}
