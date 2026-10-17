package com.thunderfood.backend.dto.product;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductListItemResponse {
    private Long id;
    private String name;
    private String slug;
    private String categoryName;
    private String thumbnailUrl;
    private BigDecimal price;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private BigDecimal originalPrice;

    private Double ratingAverage;
    private Integer soldCount;
    private String soldCountDisplay;
    private Boolean isFavorite;
    private Integer cartQuantity;
    private Boolean canPurchase;
}
