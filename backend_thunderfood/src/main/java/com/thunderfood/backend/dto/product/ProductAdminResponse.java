package com.thunderfood.backend.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductAdminResponse {

    private Long id;
    private String name;
    private String slug;
    private CategoryBriefDto category;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private Integer stockQuantity;
    private Integer soldCount;
    private BigDecimal avgRating;
    private Boolean isAvailable;
    private String description;
    private List<ProductImageDto> images;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
