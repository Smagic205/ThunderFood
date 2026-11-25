package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.payment.*;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface PaymentService {

    SepayPaymentInfoResponse getSepayPaymentInfo(Long userId, Long orderId);

    SepayGatewayCheckoutResponse initSepayGatewayCheckout(Long userId, Long orderId, String returnOrigin);

    PaymentStatusResponse verifySepayGatewayOrder(Long userId, Long orderId);

    PaymentStatusResponse getOrderPaymentStatus(Long userId, Long orderId);

    PaymentStatusResponse simulateSandboxPayment(Long userId, Long orderId);

    Map<String, Object> handleSepayWebhook(String authorizationHeader, SepayWebhookRequest payload);

    Map<String, Object> handleSepayGatewayIpn(String secretKeyHeader, String authorizationHeader, SepayGatewayIpnRequest payload);

    PageResponse<PaymentHistoryResponse> getMyPayments(Long userId, Pageable pageable);
}
