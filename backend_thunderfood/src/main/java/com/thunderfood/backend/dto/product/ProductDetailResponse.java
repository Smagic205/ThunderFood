package com.thunderfood.backend.dto.product;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailResponse {
    private Long id;
    private String name;
    private String slug;
    private CategoryBriefDto category;
    private List<String> badges;
    private List<ProductImageDto> images;
    private Double ratingAverage;
    private Long reviewCount;
    private Integer soldCount;
    private String soldCountDisplay;
    private BigDecimal price;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private BigDecimal originalPrice;

    private String shortDescription;
    private String description;
    private StockStatusDto stockStatus;
    private DeliveryInfoDto delivery;
    private List<String> highlights;
    private ProductDetailsDto details;
    private Boolean isFavorite;
    private Integer cartQuantity;
    private Boolean canPurchase;
}
