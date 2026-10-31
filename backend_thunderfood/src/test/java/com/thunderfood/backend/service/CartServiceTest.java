package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.cart.AddToCartRequest;
import com.thunderfood.backend.dto.cart.CartResponse;
import com.thunderfood.backend.dto.cart.UpdateCartItemRequest;
import com.thunderfood.backend.entity.Cart;
import com.thunderfood.backend.entity.CartItem;
import com.thunderfood.backend.entity.Product;
import com.thunderfood.backend.entity.ProductImage;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.CartItemRepository;
import com.thunderfood.backend.repository.CartRepository;
import com.thunderfood.backend.repository.ProductImageRepository;
import com.thunderfood.backend.repository.ProductRepository;
import com.thunderfood.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductImageRepository productImageRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CartService cartService;

    private User mockUser;
    private Cart mockCart;
    private Product mockProduct1;
    private Product mockProduct2;
    private CartItem mockCartItem1;
    private CartItem mockCartItem2;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(1L)
                .fullName("Nguyễn Văn A")
                .email("khachhang@thunderfood.vn")
                .role(Role.builder().id(1).name("CUSTOMER").build())
                .status("ACTIVE")
                .build();

        mockCart = Cart.builder()
                .id(10L)
                .user(mockUser)
                .items(new ArrayList<>())
                .build();

        mockProduct1 = Product.builder()
                .id(101L)
                .name("Cơm Tấm Sườn Bì Chả")
                .slug("com-tam-suon-bi-cha")
                .price(BigDecimal.valueOf(50000))
                .discountPrice(BigDecimal.valueOf(45000)) // Tiết kiệm 5.000đ mỗi phần
                .stockQuantity(20)
                .isAvailable(true)
                .build();

        mockProduct2 = Product.builder()
                .id(102L)
                .name("Trà Đào Cam Sả")
                .slug("tra-dao-cam-sa")
                .price(BigDecimal.valueOf(30000))
                .discountPrice(null)
                .stockQuantity(10)
                .isAvailable(true)
                .build();

        mockCartItem1 = CartItem.builder()
                .id(1001L)
                .cart(mockCart)
                .product(mockProduct1)
                .quantity(2)
                .build();

        mockCartItem2 = CartItem.builder()
                .id(1002L)
                .cart(mockCart)
                .product(mockProduct2)
                .quantity(1)
                .build();
    }

    @Test
    @DisplayName("getCart - Thành công với các tính toán giá tiền, chiết khấu và ảnh thumbnail")
    void getCart_shouldReturnCartResponseWithCalculatedPrices() {
        // Given
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(mockCart));
        when(cartItemRepository.findByCartId(10L)).thenReturn(List.of(mockCartItem1, mockCartItem2));

        ProductImage img1 = ProductImage.builder().id(1L).product(mockProduct1).imageUrl("https://cdn/suon.jpg").build();
        ProductImage img2 = ProductImage.builder().id(2L).product(mockProduct2).imageUrl("https://cdn/tradao.jpg").build();
        when(productImageRepository.findByProductIdInOrderByPriority(anyCollection())).thenReturn(List.of(img1, img2));

        // When
        CartResponse response = cartService.getCart(1L);

        // Then
        assertNotNull(response);
        assertEquals(10L, response.getCartId());
        assertEquals(2, response.getTotalItems());
        assertEquals(3, response.getTotalQuantity()); // 2 mockProduct1 + 1 mockProduct2

        // Product 1: giá gốc 50.000, giá bán 45.000, số lượng 2 => subtotal 90.000, tiết kiệm 10.000
        // Product 2: giá gốc 30.000, giá bán 30.000, số lượng 1 => subtotal 30.000, tiết kiệm 0
        // Tổng tiền hàng gốc: 100.000 + 30.000 = 130.000
        // Tổng tiết kiệm: 10.000
        // Tổng thanh toán: 120.000
        assertEquals(BigDecimal.valueOf(130000), response.getSubtotal());
        assertEquals(BigDecimal.valueOf(10000), response.getDiscountTotal());
        assertEquals(BigDecimal.valueOf(120000), response.getFinalAmount());

        assertEquals("https://cdn/suon.jpg", response.getItems().get(0).getImageUrl());
        assertEquals("https://cdn/tradao.jpg", response.getItems().get(1).getImageUrl());
    }

    @Test
    @DisplayName("getCart - Khi user chưa có giỏ hàng trong DB thì tự động tạo giỏ mới")
    void getCart_whenCartDoesNotExist_shouldCreateCartAndReturnEmpty() {
        // Given
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(cartRepository.save(any(Cart.class))).thenReturn(mockCart);
        when(cartItemRepository.findByCartId(10L)).thenReturn(Collections.emptyList());

        // When
        CartResponse response = cartService.getCart(1L);

        // Then
        assertNotNull(response);
        assertEquals(10L, response.getCartId());
        assertEquals(0, response.getTotalItems());
        assertEquals(0, response.getTotalQuantity());
        assertEquals(BigDecimal.ZERO, response.getFinalAmount());
        verify(cartRepository, times(1)).save(any(Cart.class));
    }

    @Test
    @DisplayName("getCartCount - Trả về đúng tổng số lượng món cho badge trên Header")
    void getCartCount_shouldReturnSumQuantity() {
        // Given
        when(cartItemRepository.sumQuantityByUserId(1L)).thenReturn(5);

        // When
        Integer count = cartService.getCartCount(1L);

        // Then
        assertEquals(5, count);

        // When null from DB
        when(cartItemRepository.sumQuantityByUserId(2L)).thenReturn(null);
        assertEquals(0, cartService.getCartCount(2L));
    }

    @Test
    @DisplayName("addToCart - Thêm món mới vào giỏ thành công")
    void addToCart_newItem_shouldSaveAndReturnUpdatedCart() {
        // Given
        AddToCartRequest request = AddToCartRequest.builder()
                .productId(101L)
                .quantity(3)
                .build();

        when(productRepository.findById(101L)).thenReturn(Optional.of(mockProduct1));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(mockCart));
        when(cartItemRepository.findByCartIdAndProductId(10L, 101L)).thenReturn(Optional.empty());
        when(cartItemRepository.findByCartId(10L)).thenReturn(List.of(mockCartItem1));

        // When
        CartResponse response = cartService.addToCart(1L, request);

        // Then
        assertNotNull(response);
        verify(cartItemRepository, times(1)).save(any(CartItem.class));
    }

    @Test
    @DisplayName("addToCart - Thêm món đã có trong giỏ thì tự động cộng dồn số lượng")
    void addToCart_existingItem_shouldAddQuantitiesAndSave() {
        // Given
        AddToCartRequest request = AddToCartRequest.builder()
                .productId(101L)
                .quantity(2)
                .build();

        when(productRepository.findById(101L)).thenReturn(Optional.of(mockProduct1));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(mockCart));
        when(cartItemRepository.findByCartIdAndProductId(10L, 101L)).thenReturn(Optional.of(mockCartItem1));
        when(cartItemRepository.findByCartId(10L)).thenReturn(List.of(mockCartItem1));

        // When
        cartService.addToCart(1L, request);

        // Then
        // mockCartItem1 ban đầu có quantity = 2, thêm 2 nữa thành 4
        assertEquals(4, mockCartItem1.getQuantity());
        verify(cartItemRepository, times(1)).save(mockCartItem1);
    }

    @Test
    @DisplayName("addToCart - Vượt quá số lượng tồn kho ném IllegalArgumentException")
    void addToCart_whenQuantityExceedsStock_shouldThrowException() {
        // Given (mockProduct1 tồn kho là 20, trong giỏ đã có 2, thêm 19 nữa thành 21 > 20)
        AddToCartRequest request = AddToCartRequest.builder()
                .productId(101L)
                .quantity(19)
                .build();

        when(productRepository.findById(101L)).thenReturn(Optional.of(mockProduct1));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(mockCart));
        when(cartItemRepository.findByCartIdAndProductId(10L, 101L)).thenReturn(Optional.of(mockCartItem1));

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                cartService.addToCart(1L, request)
        );
        assertTrue(exception.getMessage().contains("vượt quá số lượng còn lại trong kho"));
        verify(cartItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("addToCart - Số lượng < 1 ném IllegalArgumentException")
    void addToCart_whenQuantityNullOrLessThanOne_shouldThrowException() {
        AddToCartRequest request = AddToCartRequest.builder()
                .productId(101L)
                .quantity(0)
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                cartService.addToCart(1L, request)
        );
        assertTrue(exception.getMessage().contains("tối thiểu phải là 1"));
    }

    @Test
    @DisplayName("addToCart - Không tìm thấy món ăn ném ResourceNotFoundException")
    void addToCart_whenProductNotFound_shouldThrowException() {
        AddToCartRequest request = AddToCartRequest.builder()
                .productId(999L)
                .quantity(1)
                .build();

        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> cartService.addToCart(1L, request));
    }

    @Test
    @DisplayName("addToCart - Món ăn ngừng kinh doanh ném IllegalArgumentException")
    void addToCart_whenProductNotAvailable_shouldThrowException() {
        mockProduct1.setIsAvailable(false);
        AddToCartRequest request = AddToCartRequest.builder()
                .productId(101L)
                .quantity(1)
                .build();

        when(productRepository.findById(101L)).thenReturn(Optional.of(mockProduct1));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                cartService.addToCart(1L, request)
        );
        assertTrue(exception.getMessage().contains("tạm ngừng kinh doanh"));
    }

    @Test
    @DisplayName("updateCartItem - Cập nhật số lượng hợp lệ thành công")
    void updateCartItem_validQuantity_shouldUpdateAndReturnCart() {
        // Given
        UpdateCartItemRequest request = UpdateCartItemRequest.builder()
                .quantity(5)
                .build();

        when(cartItemRepository.findByIdAndCartUserId(1001L, 1L)).thenReturn(Optional.of(mockCartItem1));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(mockCart));
        when(cartItemRepository.findByCartId(10L)).thenReturn(List.of(mockCartItem1));

        // When
        CartResponse response = cartService.updateCartItem(1L, 1001L, request);

        // Then
        assertNotNull(response);
        assertEquals(5, mockCartItem1.getQuantity());
        verify(cartItemRepository, times(1)).save(mockCartItem1);
    }

    @Test
    @DisplayName("updateCartItem - Giảm về dưới 1 ném IllegalArgumentException (quy tắc giảm về đến 1 là hết)")
    void updateCartItem_quantityLessThanOne_shouldThrowException() {
        UpdateCartItemRequest request = UpdateCartItemRequest.builder()
                .quantity(0)
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                cartService.updateCartItem(1L, 1001L, request)
        );
        assertTrue(exception.getMessage().contains("tối thiểu phải là 1"));
        verify(cartItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateCartItem - Số lượng cập nhật vượt quá tồn kho ném IllegalArgumentException")
    void updateCartItem_quantityExceedsStock_shouldThrowException() {
        UpdateCartItemRequest request = UpdateCartItemRequest.builder()
                .quantity(25) // tồn kho là 20
                .build();

        when(cartItemRepository.findByIdAndCartUserId(1001L, 1L)).thenReturn(Optional.of(mockCartItem1));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                cartService.updateCartItem(1L, 1001L, request)
        );
        assertTrue(exception.getMessage().contains("vượt quá số lượng còn lại trong kho"));
        verify(cartItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateCartItem - Item không thuộc về user hoặc không tồn tại ném ResourceNotFoundException")
    void updateCartItem_itemNotFoundOrWrongUser_shouldThrowException() {
        UpdateCartItemRequest request = UpdateCartItemRequest.builder()
                .quantity(3)
                .build();

        when(cartItemRepository.findByIdAndCartUserId(9999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                cartService.updateCartItem(1L, 9999L, request)
        );
    }

    @Test
    @DisplayName("removeCartItem - Xóa 1 món ăn khỏi giỏ hàng thành công")
    void removeCartItem_shouldDeleteAndReturnCart() {
        when(cartItemRepository.findByIdAndCartUserId(1001L, 1L)).thenReturn(Optional.of(mockCartItem1));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(mockCart));
        when(cartItemRepository.findByCartId(10L)).thenReturn(List.of(mockCartItem2));

        CartResponse response = cartService.removeCartItem(1L, 1001L);

        assertNotNull(response);
        verify(cartItemRepository, times(1)).delete(mockCartItem1);
    }

    @Test
    @DisplayName("removeCartItem - Không tìm thấy món ăn ném ResourceNotFoundException")
    void removeCartItem_itemNotFound_shouldThrowException() {
        when(cartItemRepository.findByIdAndCartUserId(9999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                cartService.removeCartItem(1L, 9999L)
        );
        verify(cartItemRepository, never()).delete(any());
    }

    @Test
    @DisplayName("clearCart - Làm rỗng toàn bộ giỏ hàng thành công")
    void clearCart_shouldDeleteAllItemsAndReturnEmptyCart() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(mockCart));
        when(cartItemRepository.findByCartId(10L)).thenReturn(Collections.emptyList());

        CartResponse response = cartService.clearCart(1L);

        assertNotNull(response);
        assertEquals(0, response.getTotalItems());
        verify(cartItemRepository, times(1)).deleteByCartId(10L);
    }
}
