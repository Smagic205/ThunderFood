package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.SecurityUtils;
import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.admin.AdminOrderResponse;
import com.thunderfood.backend.dto.admin.UpdateOrderStatusRequest;
import com.thunderfood.backend.dto.order.CancelOrderRequest;
import com.thunderfood.backend.service.AdminOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Order Controller", description = "Quản lý và kiểm soát toàn bộ đơn hàng cho Quản trị viên")
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả đơn hàng cho Admin")
    public ResponseEntity<ApiResponse<List<AdminOrderResponse>>> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        List<AdminOrderResponse> orders = adminOrderService.getAllOrders(status, search, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công", orders));
    }

    @GetMapping("/{orderCode}")
    @Operation(summary = "Lấy chi tiết đơn hàng theo mã đơn hàng hoặc ID cho Admin")
    public ResponseEntity<ApiResponse<AdminOrderResponse>> getOrderByCode(@PathVariable String orderCode) {
        AdminOrderResponse order = adminOrderService.getOrderByCode(orderCode);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết đơn hàng thành công", order));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Admin cập nhật trạng thái đơn hàng")
    public ResponseEntity<ApiResponse<AdminOrderResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        Long adminId = SecurityUtils.getCurrentUserId().orElse(null);
        AdminOrderResponse response = adminOrderService.updateOrderStatus(id, request, adminId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái đơn hàng thành công", response));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Admin hủy đơn hàng kèm lý do")
    public ResponseEntity<ApiResponse<AdminOrderResponse>> cancelOrder(
            @PathVariable Long id,
            @Valid @RequestBody CancelOrderRequest request
    ) {
        Long adminId = SecurityUtils.getCurrentUserId().orElse(null);
        AdminOrderResponse response = adminOrderService.cancelOrder(id, request.getReason(), adminId);
        return ResponseEntity.ok(ApiResponse.success("Hủy đơn hàng thành công", response));
    }
}
