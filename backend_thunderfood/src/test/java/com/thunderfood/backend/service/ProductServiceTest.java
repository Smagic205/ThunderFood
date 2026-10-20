package com.thunderfood.backend.service;

import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.product.ProductDetailResponse;
import com.thunderfood.backend.dto.product.ProductFilterRequest;
import com.thunderfood.backend.dto.product.ProductListItemResponse;
import com.thunderfood.backend.entity.*;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductImageRepository productImageRepository;

    @Mock
    private WishlistRepository wishlistRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private SystemSettingRepository systemSettingRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private ProductService productService;

    private Category category;
    private Product product1;
    private Product product2;
    private User user;

    @BeforeEach
    void setUp() {
        category = Category.builder()
                .id(1)
                .name("Đồ uống")
                .slug("do-uong")
                .isActive(true)
                .build();

        product1 = Product.builder()
                .id(1L)
                .name("Trà đào cam sả")
                .slug("tra-dao-cam-sa")
                .category(category)
                .price(BigDecimal.valueOf(35000))
                .discountPrice(BigDecimal.valueOf(30000))
                .avgRating(BigDecimal.valueOf(4.8))
                .soldCount(4100)
                .stockQuantity(50)
                .isAvailable(true)
                .description("Trà thơm đào ngọt ngào")
                .build();

        product2 = Product.builder()
                .id(2L)
                .name("Trà sữa trân châu")
                .slug("tra-sua-tran-chau")
                .category(category)
                .price(BigDecimal.valueOf(45000))
                .discountPrice(null)
                .avgRating(BigDecimal.valueOf(4.5))
                .soldCount(50)
                .stockQuantity(0)
                .isAvailable(true)
                .description("Trà sữa béo ngậy")
                .build();

        user = User.builder()
                .id(100L)
                .email("test@thunderfood.com")
                .role(Role.builder().name("CUSTOMER").build())
                .status("ACTIVE")
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getProducts_invalidPage_throwsIllegalArgumentException() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                productService.getProducts(0, 15, null, null, null, "bestSelling"));
        assertEquals("Số trang (page) phải lớn hơn hoặc bằng 1", ex.getMessage());
    }

    @Test
    void getProducts_invalidSize_throwsIllegalArgumentException() {
        IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class, () ->
                productService.getProducts(1, 0, null, null, null, "bestSelling"));
        assertEquals("Kích thước trang (size) phải từ 1 đến 50", ex1.getMessage());

        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () ->
                productService.getProducts(1, 51, null, null, null, "bestSelling"));
        assertEquals("Kích thước trang (size) phải từ 1 đến 50", ex2.getMessage());
    }

    @Test
    void getProducts_pageBeyondTotalPages_returnsEmptyContentAndCorrectPagination() {
        Page<Product> emptyPage = new PageImpl<>(Collections.emptyList(), Pageable.ofSize(15), 48);
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        PageResponse<ProductListItemResponse> result = productService.getProducts(
                10, 15, null, null, null, "bestSelling");

        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());
        assertEquals(10, result.getPagination().getPage());
        assertEquals(15, result.getPagination().getSize());
        assertEquals(48, result.getPagination().getTotalElements());
        assertEquals(4, result.getPagination().getTotalPages());
        assertFalse(result.getPagination().isHasNext());
        assertTrue(result.getPagination().isHasPrevious());
    }

    @Test
    void getProducts_guestUser_returnsFalseFavoriteAndZeroCartQuantity() {
        Page<Product> page = new PageImpl<>(List.of(product1, product2), Pageable.ofSize(15), 2);
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        ProductImage img1 = ProductImage.builder().id(10L).product(product1).imageUrl("https://cdn/img1.png").isThumbnail(true).sortOrder(0).build();
        when(productImageRepository.findByProductIdInOrderByPriority(anyList())).thenReturn(List.of(img1));

        PageResponse<ProductListItemResponse> result = productService.getProducts(
                1, 15, null, null, null, "bestSelling");

        assertEquals(2, result.getContent().size());
        ProductListItemResponse item1 = result.getContent().get(0);
        assertEquals(1L, item1.getId());
        assertEquals("Trà đào cam sả", item1.getName());
        assertEquals("Đồ uống", item1.getCategoryName());
        assertEquals("https://cdn/img1.png", item1.getThumbnailUrl());
        assertEquals(BigDecimal.valueOf(30000), item1.getPrice());
        assertEquals(BigDecimal.valueOf(35000), item1.getOriginalPrice());
        assertEquals(4.8, item1.getRatingAverage());
        assertEquals(4100, item1.getSoldCount());
        assertEquals("4,1k", item1.getSoldCountDisplay());
        assertFalse(item1.getIsFavorite());
        assertEquals(0, item1.getCartQuantity());
        assertFalse(item1.getCanPurchase());

        // Verify that wishlist and cart were NOT queried for guest
        verify(wishlistRepository, never()).findProductIdsByUserIdAndProductIdIn(anyLong(), anyCollection());
        verify(cartItemRepository, never()).findCartQuantitiesByUserIdAndProductIdIn(anyLong(), anyCollection());
    }

    @Test
    void getProducts_authenticatedUser_populatesFavoriteAndCartQuantityInOneQuery() {
        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        Page<Product> page = new PageImpl<>(List.of(product1, product2), Pageable.ofSize(15), 2);
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        when(wishlistRepository.findProductIdsByUserIdAndProductIdIn(eq(100L), anyList()))
                .thenReturn(Set.of(1L));

        Object[] cartRow1 = new Object[]{1L, 2};
        when(cartItemRepository.findCartQuantitiesByUserIdAndProductIdIn(eq(100L), anyList()))
                .thenReturn(List.<Object[]>of(cartRow1));

        PageResponse<ProductListItemResponse> result = productService.getProducts(
                1, 15, null, null, null, "bestSelling");

        assertEquals(2, result.getContent().size());
        ProductListItemResponse item1 = result.getContent().get(0);
        assertTrue(item1.getIsFavorite());
        assertEquals(2, item1.getCartQuantity());
        assertTrue(item1.getCanPurchase());

        ProductListItemResponse item2 = result.getContent().get(1);
        assertFalse(item2.getIsFavorite());
        assertEquals(0, item2.getCartQuantity());
        assertFalse(item2.getCanPurchase()); // out of stock

        verify(wishlistRepository, times(1)).findProductIdsByUserIdAndProductIdIn(eq(100L), anyList());
        verify(cartItemRepository, times(1)).findCartQuantitiesByUserIdAndProductIdIn(eq(100L), anyList());
    }

    @Test
    void getProductById_found_returnsCompleteDetail() {
        when(productRepository.findByIdAndIsAvailableTrue(1L)).thenReturn(Optional.of(product1));
        when(reviewRepository.countByProductIdAndIsHiddenFalse(1L)).thenReturn(42L);

        ProductImage img1 = ProductImage.builder().id(1L).product(product1).imageUrl("https://cdn/img1.png").isThumbnail(true).sortOrder(0).build();
        ProductImage img2 = ProductImage.builder().id(2L).product(product1).imageUrl("https://cdn/img2.png").isThumbnail(false).sortOrder(1).build();
        when(productImageRepository.findByProductIdOrderByIsThumbnailDescSortOrderAsc(1L)).thenReturn(List.of(img1, img2));

        when(systemSettingRepository.findBySettingKey("FREE_SHIPPING_THRESHOLD"))
                .thenReturn(Optional.of(SystemSetting.builder().settingKey("FREE_SHIPPING_THRESHOLD").settingValue("200000").build()));

        ProductDetailResponse detail = productService.getProductById(1L);

        assertNotNull(detail);
        assertEquals(1L, detail.getId());
        assertEquals("Trà đào cam sả", detail.getName());
        assertEquals("tra-dao-cam-sa", detail.getSlug());
        assertNotNull(detail.getCategory());
        assertEquals("Đồ uống", detail.getCategory().getName());
        assertTrue(detail.getBadges().contains("Đồ uống"));
        assertTrue(detail.getBadges().contains("Bán chạy"));
        assertEquals(2, detail.getImages().size());
        assertTrue(detail.getImages().get(0).getIsMain());
        assertEquals("IN_STOCK", detail.getStockStatus().getCode());
        assertEquals("Còn hàng", detail.getStockStatus().getLabel());
        assertEquals(new BigDecimal("200000"), detail.getDelivery().getFreeShipThreshold());
        assertEquals(30, detail.getDelivery().getEstimateMinutes());
        assertEquals(42L, detail.getReviewCount());
        assertEquals("4,1k", detail.getSoldCountDisplay());
        assertEquals(BigDecimal.valueOf(30000), detail.getPrice());
        assertEquals(BigDecimal.valueOf(35000), detail.getOriginalPrice());
        assertFalse(detail.getCanPurchase()); // guest
    }

    @Test
    void getProductById_outOfStock_returnsOutOfStockStatus() {
        when(productRepository.findByIdAndIsAvailableTrue(2L)).thenReturn(Optional.of(product2));
        when(reviewRepository.countByProductIdAndIsHiddenFalse(2L)).thenReturn(5L);
        when(productImageRepository.findByProductIdOrderByIsThumbnailDescSortOrderAsc(2L)).thenReturn(Collections.emptyList());

        ProductDetailResponse detail = productService.getProductById(2L);

        assertEquals("OUT_OF_STOCK", detail.getStockStatus().getCode());
        assertEquals("Hết hàng", detail.getStockStatus().getLabel());
        assertFalse(detail.getBadges().contains("Bán chạy")); // soldCount = 50 < 100
        assertTrue(detail.getBadges().contains("Đồ uống"));
    }

    @Test
    void getProductById_notFound_throwsResourceNotFoundException() {
        when(productRepository.findByIdAndIsAvailableTrue(999L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () ->
                productService.getProductById(999L));
        assertEquals("Không tìm thấy sản phẩm", ex.getMessage());
    }

    @Test
    void getProductBySlug_notFound_throwsResourceNotFoundException() {
        when(productRepository.findBySlugAndIsAvailableTrue("khong-ton-tai")).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () ->
                productService.getProductBySlug("khong-ton-tai"));
        assertEquals("Không tìm thấy sản phẩm", ex.getMessage());
    }

    @Test
    void getProductsByCategorySlug_blankSlug_throwsIllegalArgumentException() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                productService.getProductsByCategorySlug("   ", 1, 15, null, "bestSelling"));
        assertEquals("Slug danh mục không được để trống", ex.getMessage());
    }

    @Test
    void getProductsByCategorySlug_categoryNotFound_throwsResourceNotFoundException() {
        when(categoryRepository.findBySlugAndIsActiveTrue("khong-ton-tai")).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () ->
                productService.getProductsByCategorySlug("khong-ton-tai", 1, 15, null, "bestSelling"));
        assertEquals("Không tìm thấy danh mục", ex.getMessage());
    }

    @Test
    void getProductsByCategorySlug_success_returnsProducts() {
        when(categoryRepository.findBySlugAndIsActiveTrue("do-uong")).thenReturn(Optional.of(category));
        Page<Product> page = new PageImpl<>(List.of(product1), Pageable.ofSize(15), 1);
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        ProductImage img = ProductImage.builder().id(1L).product(product1).imageUrl("https://cdn/img1.png").isThumbnail(true).sortOrder(0).build();
        when(productImageRepository.findByProductIdInOrderByPriority(anyList())).thenReturn(List.of(img));

        PageResponse<ProductListItemResponse> result = productService.getProductsByCategorySlug(
                "do-uong", 1, 15, null, "bestSelling");

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("Trà đào cam sả", result.getContent().get(0).getName());
        assertEquals("Đồ uống", result.getContent().get(0).getCategoryName());
    }

    @Test
    void getProducts_withStackedFilters_success() {
        Page<Product> page = new PageImpl<>(List.of(product1), Pageable.ofSize(15), 1);
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        ProductImage img = ProductImage.builder().id(1L).product(product1).imageUrl("https://cdn/img1.png").isThumbnail(true).sortOrder(0).build();
        when(productImageRepository.findByProductIdInOrderByPriority(anyList())).thenReturn(List.of(img));

        ProductFilterRequest filter = ProductFilterRequest.builder()
                .page(1)
                .size(15)
                .categorySlug("do-uong")
                .priceRange("lt50")
                .ratingRange("above4")
                .hasDiscount(true)
                .minSoldCount(100)
                .bestSeller(true)
                .sort("discountDesc")
                .build();

        PageResponse<ProductListItemResponse> result = productService.getProducts(filter);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("Trà đào cam sả", result.getContent().get(0).getName());
        verify(productRepository, times(1)).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getProducts_withDifferentPriceAndRatingRanges_executesQuery() {
        Page<Product> page = new PageImpl<>(List.of(product1), Pageable.ofSize(15), 1);
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        ProductImage img = ProductImage.builder().id(1L).product(product1).imageUrl("https://cdn/img1.png").isThumbnail(true).sortOrder(0).build();
        when(productImageRepository.findByProductIdInOrderByPriority(anyList())).thenReturn(List.of(img));

        String[] priceRanges = {"lt50", "m100", "m200", "gt200"};
        String[] ratingRanges = {"above4", "3to4", "under3"};

        for (String pr : priceRanges) {
            for (String rr : ratingRanges) {
                ProductFilterRequest filter = ProductFilterRequest.builder()
                        .priceRange(pr)
                        .ratingRange(rr)
                        .sort("soldCountAsc")
                        .build();
                PageResponse<ProductListItemResponse> result = productService.getProducts(filter);
                assertNotNull(result);
            }
        }

        verify(productRepository, times(priceRanges.length * ratingRanges.length)).findAll(any(Specification.class), any(Pageable.class));
    }
}
