package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.SecurityUtils;
import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.order.*;
import com.thunderfood.backend.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Order Controller", description = "Quản lý đơn hàng của khách hàng: Checkout, tính phí ship, xem lịch sử, theo dõi tiến trình và hủy đơn")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout/preview")
    @Operation(summary = "Xem trước chi phí checkout (phí ship theo phường, ngưỡng freeship, khấu trừ voucher)")
    public ResponseEntity<ApiResponse<CheckoutPreviewResponse>> previewCheckout(
            @Valid @RequestBody CheckoutPreviewRequest request
    ) {
        Long userId = getRequiredUserId();
        CheckoutPreviewResponse response = orderService.previewCheckout(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Tính toán chi phí xem trước thành công", response));
    }

    @PostMapping("/checkout")
    @Operation(summary = "Đặt hàng chính thức từ giỏ hàng")
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(
            @Valid @RequestBody PlaceOrderRequest request
    ) {
        Long userId = getRequiredUserId();
        OrderResponse response = orderService.placeOrder(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đặt hàng thành công", response));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách lịch sử đơn hàng của khách hàng")
    public ResponseEntity<ApiResponse<PageResponse<OrderListResponse>>> getMyOrders(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Long userId = getRequiredUserId();
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<OrderListResponse> response = orderService.getUserOrders(userId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử đơn hàng thành công", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết đơn hàng theo ID")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderDetail(@PathVariable Long id) {
        Long userId = getRequiredUserId();
        OrderResponse response = orderService.getOrderDetail(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết đơn hàng thành công", response));
    }

    @GetMapping("/{id}/tracking")
    @Operation(summary = "Theo dõi tiến trình và lịch sử trạng thái đơn hàng")
    public ResponseEntity<ApiResponse<OrderTrackingResponse>> getOrderTracking(@PathVariable Long id) {
        Long userId = getRequiredUserId();
        OrderTrackingResponse response = orderService.getOrderTracking(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tiến trình đơn hàng thành công", response));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy đơn hàng khi đơn còn ở trạng thái PENDING (chưa xác nhận)")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id,
            @Valid @RequestBody CancelOrderRequest request
    ) {
        Long userId = getRequiredUserId();
        OrderResponse response = orderService.cancelOrder(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Hủy đơn hàng thành công", response));
    }

    private Long getRequiredUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new AccessDeniedException("Vui lòng đăng nhập để thực hiện chức năng này"));
    }
}
