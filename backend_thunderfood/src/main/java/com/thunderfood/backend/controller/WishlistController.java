package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.SecurityUtils;
import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.wishlist.WishlistItemResponse;
import com.thunderfood.backend.dto.wishlist.WishlistToggleResponse;
import com.thunderfood.backend.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/wishlists")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Wishlist Controller", description = "Quản lý danh sách món ăn yêu thích của khách hàng")
public class WishlistController {

    private final WishlistService wishlistService;

    @PostMapping("/toggle/{productId}")
    @Operation(summary = "Thêm hoặc xóa món ăn khỏi danh sách yêu thích 1 chạm (Toggle)")
    public ResponseEntity<ApiResponse<WishlistToggleResponse>> toggleWishlist(@PathVariable Long productId) {
        Long userId = getRequiredUserId();
        WishlistToggleResponse response = wishlistService.toggleWishlist(userId, productId);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @GetMapping
    @Operation(summary = "Xem danh sách các món ăn yêu thích của khách hàng (phân trang)")
    public ResponseEntity<ApiResponse<PageResponse<WishlistItemResponse>>> getMyWishlist(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        Long userId = getRequiredUserId();
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<WishlistItemResponse> response = wishlistService.getMyWishlist(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách yêu thích thành công", response));
    }

    @GetMapping("/check/{productId}")
    @Operation(summary = "Kiểm tra món ăn này đã được thêm vào yêu thích chưa (true/false)")
    public ResponseEntity<ApiResponse<Boolean>> checkIsWishlist(@PathVariable Long productId) {
        Long userId = getRequiredUserId();
        boolean isWishlist = wishlistService.isWishlisted(userId, productId);
        return ResponseEntity.ok(ApiResponse.success("Kiểm tra yêu thích thành công", isWishlist));
    }

    @DeleteMapping("/{productId}")
    @Operation(summary = "Xóa món ăn khỏi danh sách yêu thích")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(@PathVariable Long productId) {
        Long userId = getRequiredUserId();
        wishlistService.removeFromWishlist(userId, productId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa món khỏi danh sách yêu thích", null));
    }

    private Long getRequiredUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new AccessDeniedException("Vui lòng đăng nhập để thực hiện chức năng này"));
    }
}

