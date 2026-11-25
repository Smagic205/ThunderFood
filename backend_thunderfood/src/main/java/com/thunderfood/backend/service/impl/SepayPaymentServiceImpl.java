package com.thunderfood.backend.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.payment.*;
import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.entity.OrderStatusHistory;
import com.thunderfood.backend.entity.Payment;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.exception.UnauthorizedException;
import com.thunderfood.backend.repository.OrderRepository;
import com.thunderfood.backend.repository.OrderStatusHistoryRepository;
import com.thunderfood.backend.repository.PaymentRepository;
import com.thunderfood.backend.service.NotificationService;
import com.thunderfood.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class SepayPaymentServiceImpl implements PaymentService {

    private static final String PROVIDER_SEPAY = "SEPAY";
    private static final Pattern ORDER_CODE_PATTERN = Pattern.compile("(TF\\d{8,14})", Pattern.CASE_INSENSITIVE);
    private static final Set<String> ALLOWED_RETURN_ORIGINS = Set.of(
            "https://thunderfoods.vercel.app",
            "http://localhost:5173",
            "http://127.0.0.1:5173"
    );
    private static final List<String> SIGNED_FIELD_ORDER = List.of(
            "merchant",
            "env",
            "operation",
            "payment_method",
            "order_amount",
            "currency",
            "order_invoice_number",
            "order_description",
            "customer_id",
            "agreement_id",
            "agreement_name",
            "agreement_type",
            "agreement_payment_frequency",
            "agreement_amount_per_payment",
            "success_url",
            "error_url",
            "cancel_url",
            "order_id"
    );

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final NotificationService notificationService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${sepay.enabled:true}")
    private boolean sepayEnabled;

    @Value("${sepay.sandbox:true}")
    private boolean sandboxMode;

    @Value("${sepay.merchant-id:}")
    private String merchantId;

    @Value("${sepay.secret-key:}")
    private String secretKey;

    @Value("${sepay.checkout-url:https://pay-sandbox.sepay.vn/v1/checkout/init}")
    private String checkoutUrl;

    @Value("${sepay.pg-api-url:https://pgapi-sandbox.sepay.vn}")
    private String pgApiUrl;

    @Value("${sepay.pg-payment-method:BANK_TRANSFER}")
    private String pgPaymentMethod;

    @Value("${sepay.bank-code:MBBank}")
    private String bankCode;

    @Value("${sepay.account-number:}")
    private String accountNumber;

    @Value("${sepay.account-name:}")
    private String accountName;

    @Value("${sepay.webhook-api-key:}")
    private String webhookApiKey;

    @Value("${sepay.qr-base-url:https://qr.sepay.vn/img}")
    private String qrBaseUrl;

    @Value("${app.frontend-url:https://thunderfoods.vercel.app}")
    private String appFrontendUrl;

    @Override
    @Transactional
    public SepayPaymentInfoResponse getSepayPaymentInfo(Long userId, Long orderId) {
        Order order = validateOrderForSepay(userId, orderId);
        Payment payment = ensurePendingPayment(order);

        String amountStr = order.getTotalAmount()
                .setScale(0, RoundingMode.HALF_UP)
                .toPlainString();

        String qrUrl = String.format(
                "%s?acc=%s&bank=%s&amount=%s&des=%s&template=compact",
                qrBaseUrl.replaceAll("/+$", ""),
                urlEncode(accountNumber),
                urlEncode(bankCode),
                urlEncode(amountStr),
                urlEncode(order.getOrderCode())
        );

        return SepayPaymentInfoResponse.builder()
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .amount(order.getTotalAmount())
                .bankCode(bankCode)
                .accountNumber(accountNumber)
                .accountName(accountName)
                .transferContent(order.getOrderCode())
                .qrImageUrl(qrUrl)
                .paymentStatus(order.getPaymentStatus())
                .orderStatus(order.getStatus())
                .sandboxMode(sandboxMode)
                .transactionCode(payment != null ? payment.getTransactionCode() : null)
                .paidAt(payment != null ? payment.getPaidAt() : null)
                .build();
    }

    @Override
    @Transactional
    public SepayGatewayCheckoutResponse initSepayGatewayCheckout(Long userId, Long orderId, String returnOrigin) {
        Order order = validateOrderForSepay(userId, orderId);
        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            throw new IllegalArgumentException("Đơn hàng này đã được thanh toán");
        }
        if (merchantId == null || merchantId.isBlank() || secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("Chưa cấu hình SEPAY_MERCHANT_ID / SEPAY_SECRET_KEY");
        }

        ensurePendingPayment(order);

        String baseReturnUrl = resolveReturnBaseUrl(returnOrigin);
        String amountStr = order.getTotalAmount().setScale(0, RoundingMode.HALF_UP).toPlainString();

        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("merchant", merchantId.trim());
        fields.put("operation", "PURCHASE");
        if (pgPaymentMethod != null && !pgPaymentMethod.isBlank()) {
            fields.put("payment_method", pgPaymentMethod.trim());
        }
        fields.put("order_amount", amountStr);
        fields.put("currency", "VND");
        fields.put("order_invoice_number", order.getOrderCode());
        fields.put("order_description", "Thanh toan don hang " + order.getOrderCode());
        fields.put("customer_id", String.valueOf(userId));
        fields.put("success_url", baseReturnUrl + "/account/orders?sepayStatus=success&orderId=" + order.getId());
        fields.put("error_url", baseReturnUrl + "/account/orders?sepayStatus=error&orderId=" + order.getId());
        fields.put("cancel_url", baseReturnUrl + "/account/orders?sepayStatus=cancel&orderId=" + order.getId());

        String signature = signGatewayFields(fields);
        fields.put("signature", signature);

        return SepayGatewayCheckoutResponse.builder()
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .amount(order.getTotalAmount())
                .checkoutUrl(checkoutUrl)
                .fields(fields)
                .sandboxMode(sandboxMode)
                .build();
    }

    @Override
    @Transactional
    public PaymentStatusResponse verifySepayGatewayOrder(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            return getOrderPaymentStatus(userId, orderId);
        }

        try {
            String detailUrl = pgApiUrl.replaceAll("/+$", "") + "/v1/order/detail/" + urlEncode(order.getOrderCode());
            String basicToken = Base64.getEncoder().encodeToString(
                    (merchantId.trim() + ":" + secretKey.trim()).getBytes(StandardCharsets.UTF_8)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(detailUrl))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Basic " + basicToken)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode data = root.path("data");
                String pgStatus = data.path("order_status").asText("");
                if ("CAPTURED".equalsIgnoreCase(pgStatus)) {
                    BigDecimal paidAmount = data.hasNonNull("order_amount")
                            ? new BigDecimal(data.path("order_amount").asText())
                            : order.getTotalAmount();

                    String txId = data.path("order_id").asText(order.getOrderCode());
                    JsonNode transactions = data.path("transactions");
                    if (transactions.isArray() && !transactions.isEmpty()) {
                        JsonNode firstTx = transactions.get(0);
                        if (firstTx.hasNonNull("transaction_id")) {
                            txId = firstTx.path("transaction_id").asText();
                        } else if (firstTx.hasNonNull("id")) {
                            txId = firstTx.path("id").asText();
                        }
                    }

                    markOrderPaid(order.getOrderCode(), "SEPAY-PG-" + txId, paidAmount, response.body());
                }
            } else {
                log.warn("Không thể đối soát đơn {} từ SePay PG API: status={}", order.getOrderCode(), response.statusCode());
            }
        } catch (Exception e) {
            log.warn("Lỗi gọi SePay PG API đối soát đơn {}: {}", order.getOrderCode(), e.getMessage());
        }

        return getOrderPaymentStatus(userId, orderId);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentStatusResponse getOrderPaymentStatus(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        Payment latestPayment = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId()).orElse(null);

        return PaymentStatusResponse.builder()
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .orderStatus(order.getStatus())
                .amount(order.getTotalAmount())
                .transactionCode(latestPayment != null ? latestPayment.getTransactionCode() : null)
                .paidAt(latestPayment != null ? latestPayment.getPaidAt() : null)
                .build();
    }

    @Override
    @Transactional
    public PaymentStatusResponse simulateSandboxPayment(Long userId, Long orderId) {
        if (!sandboxMode) {
            throw new AccessDeniedException("Chức năng thanh toán tiền ảo chỉ khả dụng ở chế độ Sandbox");
        }

        Order order = validateOrderForSepay(userId, orderId);

        SepayWebhookRequest simulatedPayload = SepayWebhookRequest.builder()
                .id(System.currentTimeMillis())
                .gateway(bankCode)
                .accountNumber(accountNumber)
                .code(order.getOrderCode())
                .content(order.getOrderCode() + " THANH TOAN SANDBOX")
                .transferType("in")
                .description("Giao dịch tiền ảo SePay Sandbox")
                .transferAmount(order.getTotalAmount())
                .referenceCode("SANDBOX-" + order.getOrderCode())
                .build();

        processIncomingTransfer(simulatedPayload);

        return getOrderPaymentStatus(userId, orderId);
    }

    @Override
    @Transactional
    public Map<String, Object> handleSepayWebhook(String authorizationHeader, SepayWebhookRequest payload) {
        validateWebhookApiKey(authorizationHeader);

        if (payload == null || !"in".equalsIgnoreCase(payload.getTransferType())) {
            log.info("Bỏ qua webhook SePay không phải giao dịch tiền vào: transferType={}",
                    payload != null ? payload.getTransferType() : null);
            return Map.of("success", true);
        }

        processIncomingTransfer(payload);
        return Map.of("success", true);
    }

    @Override
    @Transactional
    public Map<String, Object> handleSepayGatewayIpn(
            String secretKeyHeader,
            String authorizationHeader,
            SepayGatewayIpnRequest payload
    ) {
        validateGatewayIpnSecret(secretKeyHeader, authorizationHeader);

        if (payload == null || payload.getOrder() == null) {
            return Map.of("success", true);
        }

        String notificationType = payload.getNotificationType();
        String pgOrderStatus = payload.getOrder().getOrderStatus();
        boolean isPaidNotification = "ORDER_PAID".equalsIgnoreCase(notificationType)
                || "CAPTURED".equalsIgnoreCase(pgOrderStatus);

        if (!isPaidNotification) {
            log.info("Bỏ qua IPN SePay PG không phải ORDER_PAID: notificationType={}, orderStatus={}",
                    notificationType, pgOrderStatus);
            return Map.of("success", true);
        }

        String orderCode = payload.getOrder().getOrderInvoiceNumber();
        if (orderCode == null || orderCode.isBlank()) {
            log.warn("IPN SePay PG thiếu order_invoice_number");
            return Map.of("success", true);
        }

        String txPart = null;
        if (payload.getTransaction() != null) {
            txPart = payload.getTransaction().getTransactionId() != null
                    ? payload.getTransaction().getTransactionId()
                    : payload.getTransaction().getId();
        }
        if (txPart == null || txPart.isBlank()) {
            txPart = payload.getOrder().getOrderId() != null
                    ? payload.getOrder().getOrderId()
                    : String.valueOf(System.currentTimeMillis());
        }

        BigDecimal amount = payload.getOrder().getOrderAmount();
        if (amount == null && payload.getTransaction() != null) {
            amount = payload.getTransaction().getTransactionAmount();
        }

        markOrderPaid(orderCode.trim().toUpperCase(), "SEPAY-PG-" + txPart, amount, toJsonSafe(payload));
        return Map.of("success", true);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PaymentHistoryResponse> getMyPayments(Long userId, Pageable pageable) {
        Page<Payment> page = paymentRepository.findByOrderUserIdOrderByCreatedAtDesc(userId, pageable);

        PaginationInfo pagination = PaginationInfo.builder()
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();

        return PageResponse.<PaymentHistoryResponse>builder()
                .content(page.getContent().stream().map(PaymentHistoryResponse::fromEntity).toList())
                .pagination(pagination)
                .build();
    }

    private Order validateOrderForSepay(Long userId, Long orderId) {
        if (!sepayEnabled) {
            throw new IllegalStateException("Cổng thanh toán SePay hiện đang tạm bảo trì");
        }

        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        if (!PROVIDER_SEPAY.equalsIgnoreCase(order.getPaymentMethod())) {
            throw new IllegalArgumentException("Đơn hàng này không sử dụng phương thức thanh toán SePay");
        }
        if ("CANCELLED".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalArgumentException("Đơn hàng đã bị hủy, không thể thanh toán");
        }
        return order;
    }

    private Payment ensurePendingPayment(Order order) {
        Payment payment = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId()).orElse(null);
        if (payment == null && !"PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            payment = paymentRepository.save(Payment.builder()
                    .order(order)
                    .provider(PROVIDER_SEPAY)
                    .amount(order.getTotalAmount())
                    .status("PENDING")
                    .build());
        }
        return payment;
    }

    private void processIncomingTransfer(SepayWebhookRequest payload) {
        String txCode = buildTransactionCode(payload);
        String orderCode = extractOrderCode(payload);
        if (orderCode == null) {
            log.warn("Webhook SePay không tìm thấy mã đơn hàng trong content='{}', code='{}'",
                    payload.getContent(), payload.getCode());
            return;
        }
        markOrderPaid(orderCode, txCode, payload.getTransferAmount(), toJsonSafe(payload));
    }

    private void markOrderPaid(String orderCode, String txCode, BigDecimal paidAmount, String rawJson) {
        if (paymentRepository.existsByTransactionCodeAndStatus(txCode, "SUCCESS")) {
            log.info("Giao dịch SePay {} đã được xử lý trước đó (idempotent skip)", txCode);
            return;
        }

        Optional<Order> orderOpt = orderRepository.findByOrderCode(orderCode);
        if (orderOpt.isEmpty()) {
            log.warn("Không tìm thấy đơn hàng khớp mã '{}' từ SePay", orderCode);
            return;
        }

        Order order = orderRepository.findByIdWithLock(orderOpt.get().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderCode));

        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            log.info("Đơn hàng {} đã ở trạng thái PAID, bỏ qua giao dịch {}", orderCode, txCode);
            return;
        }

        if ("CANCELLED".equalsIgnoreCase(order.getStatus())) {
            log.warn("Đơn hàng {} đã bị hủy trước khi nhận tiền SePay {}", orderCode, txCode);
            savePaymentRecord(order, txCode, paidAmount, "FAILED", rawJson, null);
            return;
        }

        BigDecimal effectiveAmount = paidAmount != null ? paidAmount : BigDecimal.ZERO;
        if (effectiveAmount.compareTo(order.getTotalAmount()) < 0) {
            log.warn("Số tiền thanh toán SePay không đủ cho đơn {}: nhận={}, cần={}",
                    orderCode, effectiveAmount, order.getTotalAmount());
            savePaymentRecord(order, txCode, effectiveAmount, "FAILED", rawJson, null);
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        order.setPaymentStatus("PAID");
        orderRepository.save(order);

        savePaymentRecord(order, txCode, effectiveAmount, "SUCCESS", rawJson, now);

        orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                .order(order)
                .status(order.getStatus())
                .note("Thanh toán SePay thành công (Mã GD: " + txCode + ")")
                .changedBy(order.getUser())
                .build());

        notificationService.sendNotification(
                order.getUser(),
                "Thanh toán thành công",
                "Đơn hàng " + order.getOrderCode() + " đã được thanh toán qua SePay (" + effectiveAmount.setScale(0, RoundingMode.HALF_UP) + "đ).",
                "PAYMENT"
        );

        log.info("Xác nhận thanh toán SePay thành công: orderCode={}, txCode={}, amount={}",
                orderCode, txCode, effectiveAmount);
    }

    private void savePaymentRecord(
            Order order,
            String txCode,
            BigDecimal amount,
            String status,
            String rawJson,
            LocalDateTime paidAt
    ) {
        Payment payment = paymentRepository
                .findTopByOrderIdAndProviderAndStatusOrderByCreatedAtDesc(order.getId(), PROVIDER_SEPAY, "PENDING")
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .provider(PROVIDER_SEPAY)
                        .build());

        payment.setTransactionCode(txCode);
        payment.setAmount(amount != null ? amount : order.getTotalAmount());
        payment.setStatus(status);
        payment.setRawResponse(rawJson);
        payment.setPaidAt(paidAt);
        paymentRepository.save(payment);
    }

    private String signGatewayFields(Map<String, String> fields) {
        List<String> signed = new ArrayList<>();
        for (String key : SIGNED_FIELD_ORDER) {
            if (fields.containsKey(key) && fields.get(key) != null) {
                signed.add(key + "=" + fields.get(key));
            }
        }
        String canonical = String.join(",", signed);
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec(secretKey.trim().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] rawHmac = hmac.doFinal(canonical.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(rawHmac);
        } catch (Exception e) {
            throw new IllegalStateException("Không thể ký dữ liệu SePay Checkout", e);
        }
    }

    private String resolveReturnBaseUrl(String returnOrigin) {
        if (returnOrigin != null && !returnOrigin.isBlank()) {
            String normalized = returnOrigin.trim().replaceAll("/+$", "");
            if (ALLOWED_RETURN_ORIGINS.contains(normalized)
                    || (appFrontendUrl != null && normalized.equalsIgnoreCase(appFrontendUrl.trim().replaceAll("/+$", "")))) {
                return normalized;
            }
        }
        if (appFrontendUrl != null && !appFrontendUrl.isBlank()) {
            return appFrontendUrl.trim().replaceAll("/+$", "");
        }
        return "https://thunderfoods.vercel.app";
    }

    private void validateWebhookApiKey(String authorizationHeader) {
        if (webhookApiKey == null || webhookApiKey.isBlank()) {
            throw new UnauthorizedException("Chưa cấu hình SEPAY_WEBHOOK_API_KEY trên hệ thống");
        }
        if (authorizationHeader == null || !authorizationHeader.regionMatches(true, 0, "Apikey ", 0, 7)) {
            throw new UnauthorizedException("Thiếu header Authorization: Apikey từ SePay");
        }
        String providedKey = authorizationHeader.substring(7).trim();
        boolean matched = MessageDigest.isEqual(
                webhookApiKey.getBytes(StandardCharsets.UTF_8),
                providedKey.getBytes(StandardCharsets.UTF_8)
        );
        if (!matched) {
            throw new UnauthorizedException("API Key Webhook SePay không hợp lệ");
        }
    }

    private void validateGatewayIpnSecret(String secretKeyHeader, String authorizationHeader) {
        if (secretKey == null || secretKey.isBlank()) {
            throw new UnauthorizedException("Chưa cấu hình SEPAY_SECRET_KEY trên hệ thống");
        }

        String candidate = null;
        if (secretKeyHeader != null && !secretKeyHeader.isBlank()) {
            candidate = secretKeyHeader.trim();
        } else if (authorizationHeader != null) {
            if (authorizationHeader.regionMatches(true, 0, "Apikey ", 0, 7)) {
                candidate = authorizationHeader.substring(7).trim();
            } else if (authorizationHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
                candidate = authorizationHeader.substring(7).trim();
            }
        }

        if (candidate == null) {
            throw new UnauthorizedException("Thiếu header X-Secret-Key từ SePay IPN");
        }

        boolean matchedSecret = MessageDigest.isEqual(
                secretKey.trim().getBytes(StandardCharsets.UTF_8),
                candidate.getBytes(StandardCharsets.UTF_8)
        );
        boolean matchedWebhookKey = webhookApiKey != null && !webhookApiKey.isBlank() && MessageDigest.isEqual(
                webhookApiKey.trim().getBytes(StandardCharsets.UTF_8),
                candidate.getBytes(StandardCharsets.UTF_8)
        );

        if (!matchedSecret && !matchedWebhookKey) {
            throw new UnauthorizedException("Secret Key IPN SePay không hợp lệ");
        }
    }

    private String buildTransactionCode(SepayWebhookRequest payload) {
        if (payload.getId() != null) {
            return "SEPAY-" + payload.getId();
        }
        if (payload.getReferenceCode() != null && !payload.getReferenceCode().isBlank()) {
            return "SEPAY-" + payload.getReferenceCode().trim();
        }
        return "SEPAY-" + System.currentTimeMillis();
    }

    private String extractOrderCode(SepayWebhookRequest payload) {
        if (payload.getCode() != null && !payload.getCode().isBlank()) {
            Matcher codeMatcher = ORDER_CODE_PATTERN.matcher(payload.getCode().trim());
            if (codeMatcher.find()) {
                return codeMatcher.group(1).toUpperCase();
            }
            return payload.getCode().trim().toUpperCase();
        }
        if (payload.getContent() != null && !payload.getContent().isBlank()) {
            Matcher contentMatcher = ORDER_CODE_PATTERN.matcher(payload.getContent());
            if (contentMatcher.find()) {
                return contentMatcher.group(1).toUpperCase();
            }
        }
        return null;
    }

    private String toJsonSafe(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return String.valueOf(payload);
        }
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}
