package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.SecurityUtils;
import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.cart.AddToCartRequest;
import com.thunderfood.backend.dto.cart.CartResponse;
import com.thunderfood.backend.dto.cart.UpdateCartItemRequest;
import com.thunderfood.backend.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@Tag(name = "Cart Controller", description = "Quản lý giỏ hàng của khách hàng (CRUD món trong giỏ)")
public class CartController {

    private final CartService cartService;

    /**
     * 1. Lấy thông tin chi tiết giỏ hàng của người dùng hiện tại
     */
    @GetMapping
    @Operation(summary = "Lấy giỏ hàng của người dùng hiện tại")
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = getAuthenticatedUserId(userDetails);
        CartResponse response = cartService.getCart(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin giỏ hàng thành công", response));
    }

    /**
     * 2. Lấy số lượng tổng các món trong giỏ để hiển thị huy hiệu (badge) trên Header
     */
    @GetMapping("/count")
    @Operation(summary = "Lấy tổng số lượng món trong giỏ hàng (hiển thị trên badge)")
    public ResponseEntity<ApiResponse<Integer>> getCartCount(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = getAuthenticatedUserId(userDetails);
        Integer count = cartService.getCartCount(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy số lượng giỏ hàng thành công", count));
    }

    /**
     * 3. Thêm món ăn vào giỏ hàng
     */
    @PostMapping("/items")
    @Operation(summary = "Thêm món ăn vào giỏ hàng (cộng dồn nếu đã có)")
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(
            @Valid @RequestBody AddToCartRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = getAuthenticatedUserId(userDetails);
        CartResponse response = cartService.addToCart(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Thêm món vào giỏ hàng thành công", response));
    }

    /**
     * 4. Cập nhật số lượng món ăn trong giỏ
     * Quy tắc: Tối thiểu là 1 món, không giảm xuống 0. Muốn xóa phải dùng endpoint DELETE.
     */
    @PutMapping("/items/{itemId}")
    @Operation(summary = "Cập nhật số lượng món ăn trong giỏ hàng (tối thiểu là 1)")
    public ResponseEntity<ApiResponse<CartResponse>> updateCartItem(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = getAuthenticatedUserId(userDetails);
        CartResponse response = cartService.updateCartItem(userId, itemId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật số lượng món thành công", response));
    }

    /**
     * 5. Xóa 1 món ăn khỏi giỏ hàng
     */
    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "Xóa một món ăn khỏi giỏ hàng")
    public ResponseEntity<ApiResponse<CartResponse>> removeCartItem(
            @PathVariable Long itemId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = getAuthenticatedUserId(userDetails);
        CartResponse response = cartService.removeCartItem(userId, itemId);
        return ResponseEntity.ok(ApiResponse.success("Xóa món khỏi giỏ hàng thành công", response));
    }

    /**
     * 6. Xóa toàn bộ giỏ hàng
     */
    @DeleteMapping
    @Operation(summary = "Xóa toàn bộ món ăn trong giỏ hàng")
    public ResponseEntity<ApiResponse<CartResponse>> clearCart(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = getAuthenticatedUserId(userDetails);
        CartResponse response = cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.success("Làm rỗng giỏ hàng thành công", response));
    }

    private Long getAuthenticatedUserId(UserDetailsImpl userDetails) {
        if (userDetails != null && userDetails.getUser() != null && userDetails.getUser().getId() != null) {
            return userDetails.getUser().getId();
        }
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new AccessDeniedException("Người dùng chưa đăng nhập. Vui lòng đăng nhập để truy cập giỏ hàng."));
    }
}
