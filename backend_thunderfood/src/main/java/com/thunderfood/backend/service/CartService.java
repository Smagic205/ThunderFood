package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.cart.AddToCartRequest;
import com.thunderfood.backend.dto.cart.CartResponse;
import com.thunderfood.backend.dto.cart.UpdateCartItemRequest;
import com.thunderfood.backend.entity.Cart;

public interface CartService {

    CartResponse getCart(Long userId);

    Integer getCartCount(Long userId);

    CartResponse addToCart(Long userId, AddToCartRequest request);

    CartResponse updateCartItem(Long userId, Long itemId, UpdateCartItemRequest request);

    CartResponse removeCartItem(Long userId, Long itemId);

    CartResponse clearCart(Long userId);

    Cart getOrCreateCart(Long userId);
}
