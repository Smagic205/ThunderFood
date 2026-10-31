package com.thunderfood.backend.dto.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String productSlug;
    private String imageUrl;
    private BigDecimal originalPrice;
    private BigDecimal price;
    private Integer quantity;
    private Integer stockQuantity;
    private Boolean isAvailable;
    private BigDecimal subtotal;
}
