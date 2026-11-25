package com.thunderfood.backend.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.thunderfood.backend.dto.cart.AddToCartRequest;
import com.thunderfood.backend.dto.order.CancelOrderRequest;
import com.thunderfood.backend.dto.order.PlaceOrderRequest;
import com.thunderfood.backend.dto.payment.SepayGatewayIpnRequest;
import com.thunderfood.backend.dto.payment.SepayWebhookRequest;
import com.thunderfood.backend.entity.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SepayPaymentIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("IT-06: Luồng SePay Sandbox (Tạo QR -> Chặn Webhook sai Key -> Webhook hợp lệ cập nhật PAID -> Idempotent -> Chặn tự hủy -> Lịch sử GD)")
    void sepayQrWebhookIdempotencyAndHistoryFlow() throws Exception {
        User customer = createUser("khach.sepay@gmail.com", "Khách SePay", "Customer1@", "0955667788", "CUSTOMER", "ACTIVE");
        String token = loginAndGetAccessToken("khach.sepay@gmail.com", "Customer1@");

        Category category = categoryRepository.save(Category.builder()
                .name("Combo")
                .slug("combo-sepay")
                .isActive(true)
                .build());

        Product product = productRepository.save(Product.builder()
                .category(category)
                .name("Combo Gà SePay")
                .slug("combo-ga-sepay")
                .price(new BigDecimal("100000"))
                .stockQuantity(20)
                .soldCount(0)
                .isAvailable(true)
                .build());

        ServiceWard ward = serviceWardRepository.save(ServiceWard.builder()
                .wardName("Láng Hạ")
                .district("Đống Đa")
                .type("PHUONG")
                .shippingFee(new BigDecimal("15000"))
                .isActive(true)
                .build());

        Address address = addressRepository.save(Address.builder()
                .user(customer)
                .receiverName("Khách SePay")
                .phone("0955667788")
                .ward(ward)
                .detailAddress("88 Láng Hạ")
                .isDefault(true)
                .build());

        // 1. Thêm giỏ & Đặt đơn bằng SEPAY
        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddToCartRequest(product.getId(), 1))))
                .andExpect(status().isOk());

        PlaceOrderRequest placeReq = PlaceOrderRequest.builder()
                .addressId(address.getId())
                .paymentMethod("SEPAY")
                .build();

        MvcResult orderRes = mockMvc.perform(post("/api/v1/orders/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(placeReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.paymentMethod", is("SEPAY")))
                .andExpect(jsonPath("$.data.paymentStatus", is("UNPAID")))
                .andReturn();

        JsonNode orderData = objectMapper.readTree(orderRes.getResponse().getContentAsString()).path("data");
        Long orderId = orderData.path("id").asLong();
        String orderCode = orderData.path("orderCode").asText();

        // 2. Lấy thông tin QR SePay Sandbox
        mockMvc.perform(get("/api/v1/payments/sepay/order/" + orderId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sandboxMode", is(true)))
                .andExpect(jsonPath("$.data.transferContent", is(orderCode)))
                .andExpect(jsonPath("$.data.qrImageUrl", containsString(orderCode)));

        assertThat(paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId)).isPresent();

        // 3. Webhook sai API Key -> 401 Unauthorized
        SepayWebhookRequest webhookPayload = SepayWebhookRequest.builder()
                .id(998877L)
                .gateway("MBBank")
                .accountNumber("0123456789")
                .code(orderCode)
                .content(orderCode + " thanh toan tien ao")
                .transferType("in")
                .transferAmount(new BigDecimal("115000"))
                .referenceCode("FT-SANDBOX-998877")
                .build();

        mockMvc.perform(post("/api/v1/payments/sepay/webhook")
                        .header("Authorization", "Apikey wrong-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(webhookPayload)))
                .andExpect(status().isUnauthorized());

        // 4. Webhook hợp lệ -> cập nhật PAID & SUCCESS
        mockMvc.perform(post("/api/v1/payments/sepay/webhook")
                        .header("Authorization", "Apikey test-sepay-webhook-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(webhookPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        Order paidOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(paidOrder.getPaymentStatus()).isEqualTo("PAID");

        Payment savedPayment = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId).orElseThrow();
        assertThat(savedPayment.getStatus()).isEqualTo("SUCCESS");
        assertThat(savedPayment.getTransactionCode()).isEqualTo("SEPAY-998877");
        assertThat(savedPayment.getPaidAt()).isNotNull();

        // 5. Gửi lại Webhook trùng id -> Idempotent, vẫn chỉ có 1 bản ghi payment
        mockMvc.perform(post("/api/v1/payments/sepay/webhook")
                        .header("Authorization", "Apikey test-sepay-webhook-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(webhookPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        assertThat(paymentRepository.count()).isEqualTo(1);

        // 6. Đơn đã thanh toán -> khách không được tự hủy
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CancelOrderRequest("Muốn hủy"))))
                .andExpect(status().isBadRequest());

        // 7. Lịch sử giao dịch của tôi trả về giao dịch vừa thanh toán
        mockMvc.perform(get("/api/v1/payments/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].orderCode", is(orderCode)))
                .andExpect(jsonPath("$.data.content[0].status", is("SUCCESS")));
    }

    @Test
    @DisplayName("IT-07: Mô phỏng thanh toán tiền ảo SePay Sandbox trực tiếp qua API simulate")
    void sepaySandboxSimulateEndpointFlow() throws Exception {
        User customer = createUser("khach.sim@gmail.com", "Khách Sim", "Customer1@", "0966778899", "CUSTOMER", "ACTIVE");
        String token = loginAndGetAccessToken("khach.sim@gmail.com", "Customer1@");

        Category category = categoryRepository.save(Category.builder()
                .name("Đồ uống")
                .slug("do-uong-sim")
                .isActive(true)
                .build());

        Product product = productRepository.save(Product.builder()
                .category(category)
                .name("Trà Đào")
                .slug("tra-dao")
                .price(new BigDecimal("45000"))
                .stockQuantity(10)
                .soldCount(0)
                .isAvailable(true)
                .build());

        ServiceWard ward = serviceWardRepository.save(ServiceWard.builder()
                .wardName("Thành Công")
                .district("Ba Đình")
                .type("PHUONG")
                .shippingFee(new BigDecimal("15000"))
                .isActive(true)
                .build());

        Address address = addressRepository.save(Address.builder()
                .user(customer)
                .receiverName("Khách Sim")
                .phone("0966778899")
                .ward(ward)
                .detailAddress("12 Thành Công")
                .isDefault(true)
                .build());

        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddToCartRequest(product.getId(), 1))))
                .andExpect(status().isOk());

        MvcResult orderRes = mockMvc.perform(post("/api/v1/orders/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(PlaceOrderRequest.builder()
                                .addressId(address.getId())
                                .paymentMethod("SEPAY")
                                .build())))
                .andExpect(status().isCreated())
                .andReturn();

        Long orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mockMvc.perform(post("/api/v1/payments/sepay/sandbox/simulate/" + orderId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paymentStatus", is("PAID")));

        mockMvc.perform(get("/api/v1/payments/order/" + orderId + "/status")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paymentStatus", is("PAID")));
    }

    @Test
    @DisplayName("IT-08: Cổng SePay Payment Gateway (Khởi tạo form ký HMAC-SHA256 BANK_TRANSFER -> Chặn IPN sai Secret -> IPN ORDER_PAID cập nhật PAID)")
    void sepayGatewayInitAndIpnFlow() throws Exception {
        User customer = createUser("khach.pg@gmail.com", "Khách PG", "Customer1@", "0977889900", "CUSTOMER", "ACTIVE");
        String token = loginAndGetAccessToken("khach.pg@gmail.com", "Customer1@");

        Category category = categoryRepository.save(Category.builder()
                .name("Burger")
                .slug("burger-pg")
                .isActive(true)
                .build());

        Product product = productRepository.save(Product.builder()
                .category(category)
                .name("Burger Bò Phô Mai")
                .slug("burger-bo-pho-mai")
                .price(new BigDecimal("85000"))
                .stockQuantity(15)
                .soldCount(0)
                .isAvailable(true)
                .build());

        ServiceWard ward = serviceWardRepository.save(ServiceWard.builder()
                .wardName("Giảng Võ")
                .district("Ba Đình")
                .type("PHUONG")
                .shippingFee(new BigDecimal("15000"))
                .isActive(true)
                .build());

        Address address = addressRepository.save(Address.builder()
                .user(customer)
                .receiverName("Khách PG")
                .phone("0977889900")
                .ward(ward)
                .detailAddress("10 Giảng Võ")
                .isDefault(true)
                .build());

        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddToCartRequest(product.getId(), 1))))
                .andExpect(status().isOk());

        MvcResult orderRes = mockMvc.perform(post("/api/v1/orders/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(PlaceOrderRequest.builder()
                                .addressId(address.getId())
                                .paymentMethod("SEPAY")
                                .build())))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode orderData = objectMapper.readTree(orderRes.getResponse().getContentAsString()).path("data");
        Long orderId = orderData.path("id").asLong();
        String orderCode = orderData.path("orderCode").asText();

        // 1. Khởi tạo form SePay PG (chỉ QR BANK_TRANSFER, returnOrigin Vercel)
        MvcResult gwRes = mockMvc.perform(post("/api/v1/payments/sepay/gateway/checkout/" + orderId)
                        .header("Authorization", "Bearer " + token)
                        .param("returnOrigin", "https://thunderfoods.vercel.app"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checkoutUrl", is("https://pay-sandbox.sepay.vn/v1/checkout/init")))
                .andExpect(jsonPath("$.data.fields.merchant", is("SP-TEST-UNIT0001")))
                .andExpect(jsonPath("$.data.fields.payment_method", is("BANK_TRANSFER")))
                .andExpect(jsonPath("$.data.fields.order_invoice_number", is(orderCode)))
                .andExpect(jsonPath("$.data.fields.order_amount", is("100000")))
                .andExpect(jsonPath("$.data.fields.success_url", is("https://thunderfoods.vercel.app/account/orders?sepayStatus=success&orderId=" + orderId)))
                .andReturn();

        String signature = objectMapper.readTree(gwRes.getResponse().getContentAsString())
                .path("data").path("fields").path("signature").asText();
        assertThat(signature).isNotBlank();

        // 2. IPN sai X-Secret-Key -> 401
        SepayGatewayIpnRequest ipnReq = SepayGatewayIpnRequest.builder()
                .timestamp(1795623200L)
                .notificationType("ORDER_PAID")
                .order(SepayGatewayIpnRequest.IpnOrder.builder()
                        .id("uuid-1")
                        .orderId("PAY-SANDBOX-001")
                        .orderStatus("CAPTURED")
                        .orderCurrency("VND")
                        .orderAmount(new BigDecimal("100000.00"))
                        .orderInvoiceNumber(orderCode)
                        .build())
                .transaction(SepayGatewayIpnRequest.IpnTransaction.builder()
                        .id("tx-1")
                        .paymentMethod("BANK_TRANSFER")
                        .transactionId("69001122")
                        .transactionStatus("APPROVED")
                        .transactionAmount(new BigDecimal("100000.00"))
                        .build())
                .build();

        mockMvc.perform(post("/api/v1/payments/sepay/ipn")
                        .header("X-Secret-Key", "wrong-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ipnReq)))
                .andExpect(status().isUnauthorized());

        // 3. IPN hợp lệ -> cập nhật đơn PAID & Payment SUCCESS
        mockMvc.perform(post("/api/v1/payments/sepay/ipn")
                        .header("X-Secret-Key", "spsk_test_unit_dummy_secret_key_0001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ipnReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        Order paidOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(paidOrder.getPaymentStatus()).isEqualTo("PAID");

        Payment payment = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId).orElseThrow();
        assertThat(payment.getStatus()).isEqualTo("SUCCESS");
        assertThat(payment.getTransactionCode()).isEqualTo("SEPAY-PG-69001122");
    }
}
