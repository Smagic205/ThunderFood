package com.thunderfood.backend.dto.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceOrderRequest {

    @NotNull(message = "Vui lòng chọn địa chỉ giao hàng")
    private Long addressId;

    private String productVoucherCode;

    private String shippingVoucherCode;

    @NotBlank(message = "Vui lòng chọn phương thức thanh toán")
    private String paymentMethod; // COD, VNPAY, MOMO, STRIPE

    private String note;
}
