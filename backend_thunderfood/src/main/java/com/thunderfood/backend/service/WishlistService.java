package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.wishlist.WishlistItemResponse;
import com.thunderfood.backend.dto.wishlist.WishlistToggleResponse;
import org.springframework.data.domain.Pageable;

public interface WishlistService {

    WishlistToggleResponse toggleWishlist(Long userId, Long productId);

    PageResponse<WishlistItemResponse> getMyWishlist(Long userId, Pageable pageable);

    boolean isWishlisted(Long userId, Long productId);

    void removeFromWishlist(Long userId, Long productId);
}

