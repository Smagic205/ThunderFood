package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.auth.RegisterRequest;
import com.thunderfood.backend.dto.staff.StaffAccountResponse;
import com.thunderfood.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/staffs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Staff Controller", description = "Chức năng quản trị: Tạo và quản lý tài khoản nhân viên (Chỉ Admin mới có quyền)")
public class AdminStaffController {

    private final UserService userService;

    @PostMapping
    @Operation(summary = "Admin tạo tài khoản nhân viên (Staff)")
    public ResponseEntity<ApiResponse<StaffAccountResponse>> createStaff(
            @Valid @RequestBody RegisterRequest request
    ) {
        StaffAccountResponse response = userService.createStaffAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo tài khoản nhân viên thành công", response));
    }

    @GetMapping
    @Operation(summary = "Admin lấy danh sách tất cả nhân viên (Staff)")
    public ResponseEntity<ApiResponse<List<StaffAccountResponse>>> getAllStaffs() {
        List<StaffAccountResponse> response = userService.getAllStaffs();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách nhân viên thành công", response));
    }
}

