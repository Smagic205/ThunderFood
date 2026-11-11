package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.banner.BannerResponse;
import com.thunderfood.backend.dto.banner.CreateBannerRequest;
import com.thunderfood.backend.dto.banner.UpdateBannerRequest;
import com.thunderfood.backend.service.BannerService;
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
@RequestMapping("/api/v1/admin/banners")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Banner Controller", description = "Quản lý Banner quảng cáo: CRUD, Thứ tự hiển thị, Bật/Tắt")
public class AdminBannerController {

    private final BannerService bannerService;

    @GetMapping
    @Operation(summary = "Admin lấy toàn bộ danh sách banner (kể cả đang tắt)")
    public ResponseEntity<ApiResponse<List<BannerResponse>>> getAllBanners() {
        List<BannerResponse> banners = bannerService.getAllBannersForAdmin();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách banner cho quản trị viên thành công", banners));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Admin lấy chi tiết một banner theo ID")
    public ResponseEntity<ApiResponse<BannerResponse>> getBannerById(@PathVariable Long id) {
        BannerResponse banner = bannerService.getBannerById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin banner thành công", banner));
    }

    @PostMapping
    @Operation(summary = "Admin tạo mới banner")
    public ResponseEntity<ApiResponse<BannerResponse>> createBanner(@Valid @RequestBody CreateBannerRequest request) {
        BannerResponse banner = bannerService.createBanner(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mới banner thành công", banner));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Admin cập nhật thông tin banner")
    public ResponseEntity<ApiResponse<BannerResponse>> updateBanner(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBannerRequest request
    ) {
        BannerResponse banner = bannerService.updateBanner(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật banner thành công", banner));
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Admin bật/tắt nhanh trạng thái hiển thị của banner")
    public ResponseEntity<ApiResponse<BannerResponse>> toggleActive(@PathVariable Long id) {
        BannerResponse banner = bannerService.toggleBannerActive(id);
        return ResponseEntity.ok(ApiResponse.success("Đổi trạng thái banner thành công", banner));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Admin xóa banner")
    public ResponseEntity<ApiResponse<Void>> deleteBanner(@PathVariable Long id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa banner thành công", null));
    }
}

