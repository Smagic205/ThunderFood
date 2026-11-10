package com.thunderfood.backend.dto.wishlist;

import com.thunderfood.backend.entity.Product;
import com.thunderfood.backend.entity.Wishlist;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistItemResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String productSlug;
    private String categoryName;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private String imageUrl;
    private BigDecimal avgRating;
    private Integer soldCount;
    private Boolean isAvailable;
    private LocalDateTime createdAt;

    public static WishlistItemResponse fromEntity(Wishlist wishlist, String imageUrl) {
        if (wishlist == null) {
            return null;
        }
        Product p = wishlist.getProduct();
        return WishlistItemResponse.builder()
                .id(wishlist.getId())
                .productId(p != null ? p.getId() : null)
                .productName(p != null ? p.getName() : null)
                .productSlug(p != null ? p.getSlug() : null)
                .categoryName(p != null && p.getCategory() != null ? p.getCategory().getName() : null)
                .price(p != null ? p.getPrice() : null)
                .discountPrice(p != null ? p.getDiscountPrice() : null)
                .imageUrl(imageUrl)
                .avgRating(p != null ? p.getAvgRating() : BigDecimal.ZERO)
                .soldCount(p != null ? p.getSoldCount() : 0)
                .isAvailable(p != null ? p.getIsAvailable() : false)
                .createdAt(wishlist.getCreatedAt())
                .build();
    }
}

