package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.wishlist.WishlistItemResponse;
import com.thunderfood.backend.dto.wishlist.WishlistToggleResponse;
import com.thunderfood.backend.entity.Product;
import com.thunderfood.backend.entity.ProductImage;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.entity.Wishlist;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.ProductImageRepository;
import com.thunderfood.backend.repository.ProductRepository;
import com.thunderfood.backend.repository.UserRepository;
import com.thunderfood.backend.repository.WishlistRepository;
import com.thunderfood.backend.service.WishlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductImageRepository productImageRepository;

    @Override
    @Transactional
    public WishlistToggleResponse toggleWishlist(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId));

        Optional<Wishlist> existing = wishlistRepository.findByUserIdAndProductId(userId, productId);

        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
            log.info("User {} đã xóa món {} khỏi yêu thích", userId, product.getName());
            return WishlistToggleResponse.builder()
                    .productId(productId)
                    .isWishlist(false)
                    .message("Đã xóa khỏi danh sách yêu thích")
                    .build();
        } else {
            Wishlist wishlist = Wishlist.builder()
                    .user(user)
                    .product(product)
                    .build();
            wishlistRepository.save(wishlist);
            log.info("User {} đã thêm món {} vào yêu thích", userId, product.getName());
            return WishlistToggleResponse.builder()
                    .productId(productId)
                    .isWishlist(true)
                    .message("Đã thêm vào danh sách yêu thích")
                    .build();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WishlistItemResponse> getMyWishlist(Long userId, Pageable pageable) {
        Page<Wishlist> wishlistPage = wishlistRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        List<Long> productIds = wishlistPage.getContent().stream()
                .map(w -> w.getProduct() != null ? w.getProduct().getId() : null)
                .filter(Objects::nonNull)
                .toList();

        Map<Long, String> thumbnailMap = loadThumbnailMap(productIds);

        List<WishlistItemResponse> content = wishlistPage.getContent().stream()
                .map(w -> {
                    String img = w.getProduct() != null ? thumbnailMap.get(w.getProduct().getId()) : null;
                    return WishlistItemResponse.fromEntity(w, img);
                })
                .toList();

        PaginationInfo pagination = PaginationInfo.builder()
                .page(wishlistPage.getNumber())
                .size(wishlistPage.getSize())
                .totalElements(wishlistPage.getTotalElements())
                .totalPages(wishlistPage.getTotalPages())
                .hasNext(wishlistPage.hasNext())
                .hasPrevious(wishlistPage.hasPrevious())
                .build();

        return PageResponse.<WishlistItemResponse>builder()
                .content(content)
                .pagination(pagination)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isWishlisted(Long userId, Long productId) {
        if (userId == null || productId == null) {
            return false;
        }
        return wishlistRepository.existsByUserIdAndProductId(userId, productId);
    }

    @Override
    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
        log.info("User {} đã xóa món ID {} khỏi yêu thích", userId, productId);
    }

    private Map<Long, String> loadThumbnailMap(List<Long> productIds) {
        if (productIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ProductImage> images = productImageRepository.findByProductIdInOrderByPriority(productIds);
        Map<Long, String> map = new HashMap<>();
        for (ProductImage img : images) {
            map.putIfAbsent(img.getProduct().getId(), img.getImageUrl());
        }
        return map;
    }
}

