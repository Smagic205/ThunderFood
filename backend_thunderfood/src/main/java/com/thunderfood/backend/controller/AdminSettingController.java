package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.setting.SystemSettingResponse;
import com.thunderfood.backend.dto.setting.UpdateSystemSettingsRequest;
import com.thunderfood.backend.service.SystemSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin System Settings Controller", description = "Quản lý cấu hình hệ thống: Ngưỡng freeship, Số đơn tối đa/gói")
public class AdminSettingController {

    private final SystemSettingService systemSettingService;

    @GetMapping
    @Operation(summary = "Lấy toàn bộ danh sách cấu hình hệ thống")
    public ResponseEntity<ApiResponse<List<SystemSettingResponse>>> getAllSettings() {
        List<SystemSettingResponse> response = systemSettingService.getAllSettings();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cài đặt hệ thống thành công", response));
    }

    @PutMapping
    @Operation(summary = "Cập nhật các cấu hình hệ thống (như FREESHIP_THRESHOLD, MAX_ORDERS_PER_PACKAGE)")
    public ResponseEntity<ApiResponse<List<SystemSettingResponse>>> updateSettings(
            @Valid @RequestBody UpdateSystemSettingsRequest request
    ) {
        List<SystemSettingResponse> response = systemSettingService.updateSettings(request.getSettings());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cài đặt hệ thống thành công", response));
    }
}

