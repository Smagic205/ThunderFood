package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.SecurityUtils;
import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.user.CustomerProfileResponse;
import com.thunderfood.backend.dto.user.UpdateCustomerProfileRequest;
import com.thunderfood.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Customer / User Profile", description = "APIs quản lý và cập nhật thông tin khách hàng")
public class UserController {

    private final UserService userService;

    /**
     * Lấy thông tin hồ sơ của khách hàng đang đăng nhập
     */
    @GetMapping("/profile")
    @Operation(summary = "Xem thông tin hồ sơ của khách hàng hiện tại (bao gồm email, tên, số điện thoại)")
    public ResponseEntity<ApiResponse<CustomerProfileResponse>> getProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = getAuthenticatedUserId(userDetails);
        CustomerProfileResponse response = userService.getCustomerProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin khách hàng thành công", response));
    }

    /**
     * Cập nhật thông tin khách hàng đang đăng nhập (tên, số điện thoại)
     * Email không cho đổi nhưng vẫn được trả về trong response.
     */
    @PutMapping("/profile")
    @Operation(summary = "Cập nhật thông tin khách hàng (tên, số điện thoại - email giữ nguyên và được trả về trong response)")
    public ResponseEntity<ApiResponse<CustomerProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateCustomerProfileRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = getAuthenticatedUserId(userDetails);
        CustomerProfileResponse response = userService.updateCustomerProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin khách hàng thành công", response));
    }

    /**
     * Lấy thông tin khách hàng theo ID (dành cho Admin hoặc chính khách hàng đó)
     */
    @GetMapping("/{id}")
    @Operation(summary = "Xem thông tin khách hàng theo ID")
    public ResponseEntity<ApiResponse<CustomerProfileResponse>> getCustomerById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        verifyUserAccess(id, userDetails);
        CustomerProfileResponse response = userService.getCustomerProfile(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin khách hàng thành công", response));
    }

    /**
     * Cập nhật thông tin khách hàng theo ID (dành cho Admin hoặc chính khách hàng đó)
     */
    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin khách hàng theo ID (tên, số điện thoại - email giữ nguyên và được trả về)")
    public ResponseEntity<ApiResponse<CustomerProfileResponse>> updateCustomerById(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerProfileRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        verifyUserAccess(id, userDetails);
        CustomerProfileResponse response = userService.updateCustomerProfile(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin khách hàng thành công", response));
    }

    private Long getAuthenticatedUserId(UserDetailsImpl userDetails) {
        if (userDetails != null && userDetails.getUser() != null && userDetails.getUser().getId() != null) {
            return userDetails.getUser().getId();
        }
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new RuntimeException("Người dùng chưa đăng nhập hoặc phiên làm việc đã hết hạn"));
    }

    private void verifyUserAccess(Long targetUserId, UserDetailsImpl userDetails) {
        Long currentUserId = getAuthenticatedUserId(userDetails);
        boolean isAdmin = userDetails != null && userDetails.getUser() != null && userDetails.getAuthorities() != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!isAdmin && !currentUserId.equals(targetUserId)) {
            throw new RuntimeException("Bạn không có quyền truy cập hoặc chỉnh sửa thông tin của người dùng khác");
        }
    }
}
