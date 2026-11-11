package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.banner.BannerResponse;
import com.thunderfood.backend.service.BannerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/banners")
@RequiredArgsConstructor
@Tag(name = "Banner Controller", description = "Lấy danh sách banner quảng cáo trang chủ cho khách hàng")
public class BannerController {

    private final BannerService bannerService;

    @GetMapping
    @Operation(summary = "Lấy danh sách banner đang hoạt động hiển thị trang chủ")
    public ResponseEntity<ApiResponse<List<BannerResponse>>> getActiveBanners() {
        List<BannerResponse> banners = bannerService.getActiveBanners();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách banner thành công", banners));
    }
}

