package com.thunderfood.backend.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductFilterRequest {

    @Builder.Default
    private int page = 1;

    @Builder.Default
    private int size = 15;

    private Integer categoryId;
    private String categorySlug;
    private String category; // alias cho categorySlug
    private String keyword;

    // Lọc theo khoảng giá: lt50 (< 50k), m100 (50k-100k), m200 (100k-200k), gt200 (> 200k)
    private String priceRange;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    // Lọc theo số sao: above4 (>= 4 sao), 3to4 (3-4 sao), under3 (< 3 sao)
    private String ratingRange;
    private Double minRating;
    private Double maxRating;

    // Lọc theo ưu đãi: true = chỉ lấy món có giảm giá
    private Boolean hasDiscount;

    // Lọc theo số lượng bán ra
    private Integer minSoldCount;
    private Boolean bestSeller; // true = soldCount >= 100

    // Sắp xếp: bestSelling | soldCountDesc | soldCountAsc | rating | priceAsc | priceDesc | newest | discountDesc
    @Builder.Default
    private String sort = "bestSelling";

    public String getEffectiveCategorySlug() {
        if (categorySlug != null && !categorySlug.trim().isEmpty()) {
            return categorySlug.trim();
        }
        if (category != null && !category.trim().isEmpty()) {
            return category.trim();
        }
        return null;
    }
}
