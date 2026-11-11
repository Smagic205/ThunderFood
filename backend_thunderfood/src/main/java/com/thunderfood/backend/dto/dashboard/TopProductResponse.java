package com.thunderfood.backend.dto.dashboard;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopProductResponse {

    private Long productId;
    private String productName;
    private String categoryName;
    private Long soldQuantity;
    private BigDecimal totalRevenue;
}

