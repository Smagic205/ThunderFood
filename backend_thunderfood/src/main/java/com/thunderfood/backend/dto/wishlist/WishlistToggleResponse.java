package com.thunderfood.backend.dto.wishlist;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistToggleResponse {

    private Long productId;
    private Boolean isWishlist;
    private String message;
}

