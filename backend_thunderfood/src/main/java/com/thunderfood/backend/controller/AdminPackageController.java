package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.admin.AdminPackageResponse;
import com.thunderfood.backend.service.AdminPackageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/packages")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Package Controller", description = "Quản lý toàn bộ gói giao hàng cho Quản trị viên")
public class AdminPackageController {

    private final AdminPackageService adminPackageService;

    @GetMapping
    @Operation(summary = "Lấy danh sách toàn bộ gói giao hàng cho Admin")
    public ResponseEntity<ApiResponse<List<AdminPackageResponse>>> getPackages(
            @RequestParam(required = false) String status
    ) {
        List<AdminPackageResponse> packages = adminPackageService.getAllPackages(status);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách gói hàng thành công", packages));
    }

    @GetMapping("/{code}")
    @Operation(summary = "Lấy thông tin chi tiết gói hàng theo tên gói hoặc ID")
    public ResponseEntity<ApiResponse<AdminPackageResponse>> getPackageByCode(@PathVariable String code) {
        AdminPackageResponse response = adminPackageService.getPackageByCode(code);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin gói hàng thành công", response));
    }

    @PostMapping("/{packageId}/assign-staff")
    @Operation(summary = "Admin chỉ định/thay đổi nhân viên giao gói hàng")
    public ResponseEntity<ApiResponse<AdminPackageResponse>> assignStaff(
            @PathVariable Long packageId,
            @RequestParam Long staffId
    ) {
        AdminPackageResponse response = adminPackageService.assignStaff(packageId, staffId);
        return ResponseEntity.ok(ApiResponse.success("Phân công nhân viên giao gói hàng thành công", response));
    }

    @DeleteMapping("/{packageId}")
    @Operation(summary = "Admin hủy / xóa gói hàng rỗng hoặc chưa giao")
    public ResponseEntity<ApiResponse<Void>> deletePackage(@PathVariable Long packageId) {
        adminPackageService.deletePackage(packageId);
        return ResponseEntity.ok(ApiResponse.success("Hủy gói hàng thành công", null));
    }
}
