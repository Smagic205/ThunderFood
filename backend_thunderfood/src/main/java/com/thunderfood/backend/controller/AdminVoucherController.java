package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.voucher.VoucherAdminResponse;
import com.thunderfood.backend.dto.voucher.VoucherRequest;
import com.thunderfood.backend.service.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/vouchers")
@RequiredArgsConstructor
public class AdminVoucherController {

    private final VoucherService voucherService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<VoucherAdminResponse>>> getAllVouchers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String voucherType,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = "asc".equalsIgnoreCase(direction) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        PageResponse<VoucherAdminResponse> vouchers = voucherService.getAllVouchersForAdmin(keyword, voucherType, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách voucher thành công", vouchers));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherAdminResponse>> getVoucherById(@PathVariable Long id) {
        VoucherAdminResponse voucher = voucherService.getVoucherById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin voucher thành công", voucher));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VoucherAdminResponse>> createVoucher(@Valid @RequestBody VoucherRequest request) {
        VoucherAdminResponse created = voucherService.createVoucher(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo voucher mới thành công", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherAdminResponse>> updateVoucher(
            @PathVariable Long id,
            @Valid @RequestBody VoucherRequest request
    ) {
        VoucherAdminResponse updated = voucherService.updateVoucher(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin voucher thành công", updated));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<VoucherAdminResponse>> toggleStatus(@PathVariable Long id) {
        VoucherAdminResponse updated = voucherService.toggleVoucherStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái voucher thành công", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVoucher(@PathVariable Long id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa/vô hiệu hóa voucher thành công", null));
    }
}
