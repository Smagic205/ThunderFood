package com.thunderfood.backend.dto.order;

import com.thunderfood.backend.dto.address.AddressResponse;
import com.thunderfood.backend.dto.cart.CartItemResponse;
import com.thunderfood.backend.dto.voucher.VoucherClientResponse;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutPreviewResponse {

    @Builder.Default
    private BigDecimal subtotalAmount = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal originalShippingFee = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal thresholdShippingDiscount = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal voucherShippingDiscount = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal finalShippingFee = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    private boolean isFreeShippingByThreshold;

    private BigDecimal freeShippingThreshold;

    private BigDecimal amountNeededForFreeShip;

    private VoucherClientResponse productVoucher;

    private VoucherClientResponse shippingVoucher;

    @Builder.Default
    private List<CartItemResponse> items = new ArrayList<>();

    private AddressResponse shippingAddress;
}
