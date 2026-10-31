package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.cart.AddToCartRequest;
import com.thunderfood.backend.dto.cart.CartItemResponse;
import com.thunderfood.backend.dto.cart.CartResponse;
import com.thunderfood.backend.dto.cart.UpdateCartItemRequest;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.CartService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CartControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private CartService cartService;

    @InjectMocks
    private CartController cartController;

    private User mockUser;
    private CartResponse mockCartResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(cartController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();

        mockUser = User.builder()
                .id(1L)
                .fullName("Nguyễn Văn A")
                .email("user@thunderfood.vn")
                .role(Role.builder().id(1).name("CUSTOMER").build())
                .build();

        CartItemResponse item1 = CartItemResponse.builder()
                .id(101L)
                .productId(1L)
                .productName("Cơm sườn")
                .productSlug("com-suon")
                .price(BigDecimal.valueOf(45000))
                .originalPrice(BigDecimal.valueOf(50000))
                .quantity(2)
                .stockQuantity(15)
                .isAvailable(true)
                .subtotal(BigDecimal.valueOf(90000))
                .build();

        mockCartResponse = CartResponse.builder()
                .cartId(10L)
                .items(List.of(item1))
                .totalItems(1)
                .totalQuantity(2)
                .subtotal(BigDecimal.valueOf(100000))
                .discountTotal(BigDecimal.valueOf(10000))
                .finalAmount(BigDecimal.valueOf(90000))
                .build();

        // Giả lập authentication đã đăng nhập
        UserDetailsImpl userDetails = new UserDetailsImpl(mockUser);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /api/v1/cart - Đã đăng nhập trả về 200 và chi tiết giỏ hàng")
    void getCart_whenAuthenticated_shouldReturn200() throws Exception {
        when(cartService.getCart(1L)).thenReturn(mockCartResponse);

        mockMvc.perform(get("/api/v1/cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.cartId", is(10)))
                .andExpect(jsonPath("$.data.totalQuantity", is(2)))
                .andExpect(jsonPath("$.data.finalAmount", is(90000)));

        verify(cartService, times(1)).getCart(1L);
    }

    @Test
    @DisplayName("GET /api/v1/cart/count - Lấy tổng số lượng món trong giỏ trả về 200")
    void getCartCount_whenAuthenticated_shouldReturn200() throws Exception {
        when(cartService.getCartCount(1L)).thenReturn(5);

        mockMvc.perform(get("/api/v1/cart/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(5)));

        verify(cartService, times(1)).getCartCount(1L);
    }

    @Test
    @DisplayName("POST /api/v1/cart/items - Thêm món hợp lệ trả về 200")
    void addToCart_validRequest_shouldReturn200() throws Exception {
        AddToCartRequest request = AddToCartRequest.builder()
                .productId(1L)
                .quantity(2)
                .build();

        when(cartService.addToCart(eq(1L), any(AddToCartRequest.class))).thenReturn(mockCartResponse);

        mockMvc.perform(post("/api/v1/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalQuantity", is(2)));
    }

    @Test
    @DisplayName("POST /api/v1/cart/items - Thiếu productId trả về 400 Bad Request")
    void addToCart_missingProductId_shouldReturn400() throws Exception {
        AddToCartRequest request = AddToCartRequest.builder()
                .productId(null)
                .quantity(2)
                .build();

        mockMvc.perform(post("/api/v1/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        verify(cartService, never()).addToCart(any(), any());
    }

    @Test
    @DisplayName("POST /api/v1/cart/items - Số lượng = 0 trả về 400 Bad Request")
    void addToCart_quantityZero_shouldReturn400() throws Exception {
        AddToCartRequest request = AddToCartRequest.builder()
                .productId(1L)
                .quantity(0)
                .build();

        mockMvc.perform(post("/api/v1/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        verify(cartService, never()).addToCart(any(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/cart/items/{itemId} - Cập nhật số lượng hợp lệ trả về 200")
    void updateCartItem_validQuantity_shouldReturn200() throws Exception {
        UpdateCartItemRequest request = UpdateCartItemRequest.builder()
                .quantity(3)
                .build();

        when(cartService.updateCartItem(eq(1L), eq(101L), any(UpdateCartItemRequest.class))).thenReturn(mockCartResponse);

        mockMvc.perform(put("/api/v1/cart/items/101")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("PUT /api/v1/cart/items/{itemId} - Số lượng < 1 trả về 400 Bad Request (Quy tắc giảm về đến 1 là hết)")
    void updateCartItem_quantityLessThanOne_shouldReturn400() throws Exception {
        UpdateCartItemRequest request = UpdateCartItemRequest.builder()
                .quantity(0)
                .build();

        mockMvc.perform(put("/api/v1/cart/items/101")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        verify(cartService, never()).updateCartItem(any(), any(), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/cart/items/{itemId} - Xóa món trả về 200")
    void removeCartItem_shouldReturn200() throws Exception {
        when(cartService.removeCartItem(1L, 101L)).thenReturn(mockCartResponse);

        mockMvc.perform(delete("/api/v1/cart/items/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Xóa món khỏi giỏ hàng thành công")));
    }

    @Test
    @DisplayName("DELETE /api/v1/cart - Làm rỗng giỏ hàng trả về 200")
    void clearCart_shouldReturn200() throws Exception {
        when(cartService.clearCart(1L)).thenReturn(mockCartResponse);

        mockMvc.perform(delete("/api/v1/cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Làm rỗng giỏ hàng thành công")));
    }

    @Test
    @DisplayName("GET /api/v1/cart - Chưa đăng nhập trả về 403 Forbidden")
    void getCart_unauthenticated_shouldReturn403() throws Exception {
        SecurityContextHolder.clearContext();

        mockMvc.perform(get("/api/v1/cart"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Người dùng chưa đăng nhập. Vui lòng đăng nhập để truy cập giỏ hàng.")));
    }
}
