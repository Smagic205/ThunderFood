package com.thunderfood.backend.dto.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {

    private Long cartId;

    @Builder.Default
    private List<CartItemResponse> items = new ArrayList<>();

    @Builder.Default
    private Integer totalItems = 0;

    @Builder.Default
    private Integer totalQuantity = 0;

    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal discountTotal = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal finalAmount = BigDecimal.ZERO;
}
