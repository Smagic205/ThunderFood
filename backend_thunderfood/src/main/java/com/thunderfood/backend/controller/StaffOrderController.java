package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.SecurityUtils;
import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.order.CancelOrderRequest;
import com.thunderfood.backend.dto.staff.ConfirmOrderRequest;
import com.thunderfood.backend.dto.staff.DeliveryPackageResponse;
import com.thunderfood.backend.dto.staff.StaffOrderDetailResponse;
import com.thunderfood.backend.dto.staff.StaffOrderListResponse;
import com.thunderfood.backend.service.StaffOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/staff/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
@Tag(name = "Staff Order Controller", description = "Chức năng duyệt đơn hàng dành cho nhân viên (Staff): danh sách đơn chờ xác nhận, xác nhận vào gói, hủy đơn")
public class StaffOrderController {

    private final StaffOrderService staffOrderService;

    @GetMapping
    @Operation(summary = "Lấy danh sách đơn hàng cho Staff (lọc theo trạng thái, phường/xã, tìm kiếm)")
    public ResponseEntity<ApiResponse<PageResponse<StaffOrderListResponse>>> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String ward,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<StaffOrderListResponse> response = staffOrderService.getStaffOrders(status, ward, search, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết đơn hàng cho nhân viên")
    public ResponseEntity<ApiResponse<StaffOrderDetailResponse>> getOrderDetail(@PathVariable Long id) {
        StaffOrderDetailResponse response = staffOrderService.getStaffOrderDetail(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết đơn hàng thành công", response));
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Nhân viên xác nhận đơn hàng và gán vào gói hàng (gói có sẵn hoặc tạo mới)")
    public ResponseEntity<ApiResponse<StaffOrderDetailResponse>> confirmOrder(
            @PathVariable Long id,
            @Valid @RequestBody ConfirmOrderRequest request
    ) {
        Long staffId = getRequiredUserId();
        StaffOrderDetailResponse response = staffOrderService.confirmOrder(id, request, staffId);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận đơn hàng và gán gói thành công", response));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Nhân viên hủy đơn hàng khi đơn còn ở trạng thái PENDING (kèm lý do)")
    public ResponseEntity<ApiResponse<StaffOrderDetailResponse>> cancelOrder(
            @PathVariable Long id,
            @Valid @RequestBody CancelOrderRequest request
    ) {
        Long staffId = getRequiredUserId();
        StaffOrderDetailResponse response = staffOrderService.cancelOrderByStaff(id, request, staffId);
        return ResponseEntity.ok(ApiResponse.success("Hủy đơn hàng thành công", response));
    }

    @GetMapping("/packages/open")
    @Operation(summary = "Lấy danh sách các gói hàng đang mở (PENDING) để chọn khi duyệt đơn")
    public ResponseEntity<ApiResponse<List<DeliveryPackageResponse>>> getOpenPackages() {
        List<DeliveryPackageResponse> response = staffOrderService.getOpenPackages();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách gói hàng đang mở thành công", response));
    }

    private Long getRequiredUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new AccessDeniedException("Vui lòng đăng nhập để thực hiện chức năng này"));
    }
}

