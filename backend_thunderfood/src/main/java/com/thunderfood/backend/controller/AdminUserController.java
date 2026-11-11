package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.SecurityUtils;
import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.user.UpdateUserRoleRequest;
import com.thunderfood.backend.dto.user.UpdateUserStatusRequest;
import com.thunderfood.backend.dto.user.UserAdminResponse;
import com.thunderfood.backend.exception.UnauthorizedException;
import com.thunderfood.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin User Controller", description = "Quản lý tài khoản: User, Nhân viên, Khóa/Mở khóa, Phân quyền")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Lấy danh sách người dùng có phân trang và bộ lọc (keyword, role, status)")
    public ResponseEntity<ApiResponse<PageResponse<UserAdminResponse>>> getAllUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = "asc".equalsIgnoreCase(direction) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        PageResponse<UserAdminResponse> response = userService.getAllUsersForAdmin(keyword, role, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách người dùng thành công", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết thông tin người dùng theo ID")
    public ResponseEntity<ApiResponse<UserAdminResponse>> getUserDetail(@PathVariable Long id) {
        UserAdminResponse response = userService.getUserDetailForAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin người dùng thành công", response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Khóa hoặc mở khóa tài khoản người dùng (ACTIVE / LOCKED)")
    public ResponseEntity<ApiResponse<UserAdminResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        Long currentAdminId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác"));
        UserAdminResponse response = userService.updateUserStatus(id, request, currentAdminId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái tài khoản thành công", response));
    }

    @PatchMapping("/{id}/role")
    @Operation(summary = "Phân quyền / Đổi vai trò tài khoản người dùng (CUSTOMER / STAFF / ADMIN)")
    public ResponseEntity<ApiResponse<UserAdminResponse>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        Long currentAdminId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác"));
        UserAdminResponse response = userService.updateUserRole(id, request, currentAdminId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật vai trò người dùng thành công", response));
    }
}

