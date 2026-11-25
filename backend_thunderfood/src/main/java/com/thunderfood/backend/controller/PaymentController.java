package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.SecurityUtils;
import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.payment.*;
import com.thunderfood.backend.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payment Controller", description = "Cổng thanh toán SePay (Payment Gateway QR, IPN, Webhook & Lịch sử giao dịch)")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/sepay/order/{orderId}")
    @Operation(summary = "Lấy thông tin & mã QR thanh toán SePay cho đơn hàng")
    public ResponseEntity<ApiResponse<SepayPaymentInfoResponse>> getSepayPaymentInfo(@PathVariable Long orderId) {
        Long userId = getRequiredUserId();
        SepayPaymentInfoResponse response = paymentService.getSepayPaymentInfo(userId, orderId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin thanh toán SePay thành công", response));
    }

    @PostMapping("/sepay/gateway/checkout/{orderId}")
    @Operation(summary = "Khởi tạo form ký HMAC-SHA256 chuyển hướng sang Cổng thanh toán SePay (QR Bank Transfer)")
    public ResponseEntity<ApiResponse<SepayGatewayCheckoutResponse>> initSepayGatewayCheckout(
            @PathVariable Long orderId,
            @RequestParam(required = false) String returnOrigin
    ) {
        Long userId = getRequiredUserId();
        SepayGatewayCheckoutResponse response = paymentService.initSepayGatewayCheckout(userId, orderId, returnOrigin);
        return ResponseEntity.ok(ApiResponse.success("Khởi tạo cổng thanh toán SePay thành công", response));
    }

    @PostMapping("/sepay/gateway/verify/{orderId}")
    @Operation(summary = "Đối soát trạng thái đơn hàng trực tiếp từ SePay PG API khi redirect về")
    public ResponseEntity<ApiResponse<PaymentStatusResponse>> verifySepayGatewayOrder(@PathVariable Long orderId) {
        Long userId = getRequiredUserId();
        PaymentStatusResponse response = paymentService.verifySepayGatewayOrder(userId, orderId);
        return ResponseEntity.ok(ApiResponse.success("Đối soát trạng thái thanh toán SePay thành công", response));
    }

    @GetMapping("/order/{orderId}/status")
    @Operation(summary = "Kiểm tra trạng thái thanh toán của đơn hàng")
    public ResponseEntity<ApiResponse<PaymentStatusResponse>> getOrderPaymentStatus(@PathVariable Long orderId) {
        Long userId = getRequiredUserId();
        PaymentStatusResponse response = paymentService.getOrderPaymentStatus(userId, orderId);
        return ResponseEntity.ok(ApiResponse.success("Lấy trạng thái thanh toán thành công", response));
    }

    @PostMapping("/sepay/sandbox/simulate/{orderId}")
    @Operation(summary = "Mô phỏng giao dịch tiền ảo SePay Sandbox (chỉ hoạt động khi sepay.sandbox=true)")
    public ResponseEntity<ApiResponse<PaymentStatusResponse>> simulateSandboxPayment(@PathVariable Long orderId) {
        Long userId = getRequiredUserId();
        PaymentStatusResponse response = paymentService.simulateSandboxPayment(userId, orderId);
        return ResponseEntity.ok(ApiResponse.success("Mô phỏng thanh toán SePay Sandbox thành công", response));
    }

    @PostMapping("/sepay/ipn")
    @Operation(summary = "IPN nhận thông báo từ Cổng thanh toán SePay (xác thực header X-Secret-Key)")
    public ResponseEntity<Map<String, Object>> handleSepayGatewayIpn(
            @RequestHeader(value = "X-Secret-Key", required = false) String secretKeyHeader,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody SepayGatewayIpnRequest payload
    ) {
        Map<String, Object> result = paymentService.handleSepayGatewayIpn(secretKeyHeader, authorizationHeader, payload);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/sepay/webhook")
    @Operation(summary = "Webhook nhận biến động số dư từ SePay Bank Hub (xác thực header Authorization: Apikey)")
    public ResponseEntity<Map<String, Object>> handleSepayWebhook(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody SepayWebhookRequest payload
    ) {
        Map<String, Object> result = paymentService.handleSepayWebhook(authorizationHeader, payload);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/my")
    @Operation(summary = "Lấy lịch sử giao dịch thanh toán của người dùng hiện tại")
    public ResponseEntity<ApiResponse<PageResponse<PaymentHistoryResponse>>> getMyPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Long userId = getRequiredUserId();
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<PaymentHistoryResponse> response = paymentService.getMyPayments(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử giao dịch thành công", response));
    }

    private Long getRequiredUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new AccessDeniedException("Vui lòng đăng nhập để thực hiện chức năng này"));
    }
}
