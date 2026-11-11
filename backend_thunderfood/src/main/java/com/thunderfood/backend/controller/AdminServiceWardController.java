package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.address.ServiceWardResponse;
import com.thunderfood.backend.dto.address.UpdateShippingFeeRequest;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.service.ServiceWardService;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/wards")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Service Ward Controller", description = "Quản lý địa bàn phục vụ & Phí ship từng phường/xã")
public class AdminServiceWardController {

    private final ServiceWardService serviceWardService;

    @GetMapping
    @Operation(summary = "Lấy danh sách phường/xã phục vụ có phân trang và bộ lọc (quận, từ khóa, trạng thái)")
    public ResponseEntity<ApiResponse<PageResponse<ServiceWardResponse>>> getAllWards(
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "wardName") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        Sort sort = "asc".equalsIgnoreCase(direction) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        PageResponse<ServiceWardResponse> response = serviceWardService.getAllWardsForAdmin(district, keyword, isActive, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phường/xã thành công", response));
    }

    @GetMapping("/districts")
    @Operation(summary = "Lấy danh sách tất cả các quận/huyện đang có phường phục vụ")
    public ResponseEntity<ApiResponse<List<String>>> getDistricts() {
        List<String> districts = serviceWardService.getDistricts();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách quận/huyện thành công", districts));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết một phường/xã")
    public ResponseEntity<ApiResponse<ServiceWardResponse>> getWardById(@PathVariable Integer id) {
        ServiceWardResponse response = serviceWardService.getWardById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin phường/xã thành công", response));
    }

    @PutMapping("/{id}/shipping-fee")
    @Operation(summary = "Cập nhật mức phí giao hàng cho phường/xã")
    public ResponseEntity<ApiResponse<ServiceWardResponse>> updateShippingFee(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateShippingFeeRequest request
    ) {
        ServiceWardResponse response = serviceWardService.updateShippingFee(id, request.getShippingFee());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật phí giao hàng thành công", response));
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Bật/Tắt trạng thái phục vụ giao hàng của phường/xã")
    public ResponseEntity<ApiResponse<ServiceWardResponse>> toggleActive(@PathVariable Integer id) {
        ServiceWardResponse response = serviceWardService.toggleWardActive(id);
        return ResponseEntity.ok(ApiResponse.success("Đổi trạng thái phục vụ thành công", response));
    }
}

