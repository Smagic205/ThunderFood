package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.SecurityUtils;
import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.voucher.VoucherCheckRequest;
import com.thunderfood.backend.dto.voucher.VoucherCheckResponse;
import com.thunderfood.backend.dto.voucher.VoucherClientResponse;
import com.thunderfood.backend.service.VoucherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/vouchers")
@RequiredArgsConstructor
@Tag(name = "Voucher Controller", description = "Dịch vụ tra cứu và kiểm tra điều kiện áp dụng voucher cho khách hàng")
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping("/available")
    @Operation(summary = "Lấy danh sách mã giảm giá đang có hiệu lực")
    public ResponseEntity<ApiResponse<List<VoucherClientResponse>>> getAvailableVouchers(
            @RequestParam(required = false) BigDecimal currentSubtotal
    ) {
        Long userId = SecurityUtils.getCurrentUserId().orElse(null);
        List<VoucherClientResponse> vouchers = voucherService.getAvailableVouchersForCustomer(userId, currentSubtotal);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách voucher khả dụng thành công", vouchers));
    }

    @PostMapping("/check")
    @Operation(summary = "Kiểm tra tính hợp lệ và tính toán số tiền giảm giá của voucher")
    public ResponseEntity<ApiResponse<VoucherCheckResponse>> checkVoucher(
            @Valid @RequestBody VoucherCheckRequest request
    ) {
        Long userId = SecurityUtils.getCurrentUserId().orElse(null);
        VoucherCheckResponse response = voucherService.checkVoucherEligibility(
                request.getCode(),
                userId,
                request.getSubtotalAmount(),
                request.getShippingFee()
        );

        if (response.isValid()) {
            return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
        } else {
            return ResponseEntity.ok(ApiResponse.error(response.getMessage(), response));
        }
    }
}
