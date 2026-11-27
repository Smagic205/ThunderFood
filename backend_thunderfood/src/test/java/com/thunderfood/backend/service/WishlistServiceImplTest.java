package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.wishlist.WishlistItemResponse;
import com.thunderfood.backend.dto.wishlist.WishlistToggleResponse;
import com.thunderfood.backend.entity.Product;
import com.thunderfood.backend.entity.ProductImage;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.entity.Wishlist;
import com.thunderfood.backend.repository.ProductImageRepository;
import com.thunderfood.backend.repository.ProductRepository;
import com.thunderfood.backend.repository.UserRepository;
import com.thunderfood.backend.repository.WishlistRepository;
import com.thunderfood.backend.service.impl.WishlistServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WishlistServiceImplTest {

    @Mock
    private WishlistRepository wishlistRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductImageRepository productImageRepository;

    @InjectMocks
    private WishlistServiceImpl wishlistService;

    @Test
    @DisplayName("toggleWishlist thêm mới nếu chưa có và xóa nếu đã tồn tại")
    void toggleWishlist_AddAndRemove() {
        User u = User.builder().id(1L).build();
        Product p = Product.builder().id(10L).name("Phở bò").price(new BigDecimal("50000")).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(productRepository.findById(10L)).thenReturn(Optional.of(p));

        when(wishlistRepository.findByUserIdAndProductId(1L, 10L)).thenReturn(Optional.empty());
        WishlistToggleResponse added = wishlistService.toggleWishlist(1L, 10L);
        assertTrue(added.getIsWishlist());
        verify(wishlistRepository).save(any(Wishlist.class));

        Wishlist existing = Wishlist.builder().id(5L).user(u).product(p).build();
        when(wishlistRepository.findByUserIdAndProductId(1L, 10L)).thenReturn(Optional.of(existing));
        WishlistToggleResponse removed = wishlistService.toggleWishlist(1L, 10L);
        assertFalse(removed.getIsWishlist());
        verify(wishlistRepository).delete(existing);
    }

    @Test
    @DisplayName("getMyWishlist tải batch thumbnail một lần cho toàn bộ trang")
    void getMyWishlist_LoadsThumbnailsInBatch() {
        User u = User.builder().id(1L).build();
        Product p = Product.builder().id(10L).name("Phở bò").slug("pho-bo").price(new BigDecimal("50000")).isAvailable(true).build();
        Wishlist w = Wishlist.builder().id(1L).user(u).product(p).build();

        when(wishlistRepository.findByUserIdOrderByCreatedAtDesc(1L, PageRequest.of(0, 10)))
                .thenReturn(new PageImpl<>(List.of(w)));
        when(productImageRepository.findByProductIdInOrderByPriority(List.of(10L)))
                .thenReturn(List.of(ProductImage.builder().product(p).imageUrl("https://cdn/pho.jpg").isThumbnail(true).build()));

        PageResponse<WishlistItemResponse> resp = wishlistService.getMyWishlist(1L, PageRequest.of(0, 10));
        assertEquals(1, resp.getContent().size());
        assertEquals("https://cdn/pho.jpg", resp.getContent().get(0).getImageUrl());
        verify(productImageRepository, times(1)).findByProductIdInOrderByPriority(List.of(10L));
    }
}
