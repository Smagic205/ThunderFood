package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.payment.PaymentHistoryResponse;
import com.thunderfood.backend.dto.payment.SepayGatewayIpnRequest;
import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.entity.Payment;
import com.thunderfood.backend.exception.UnauthorizedException;
import com.thunderfood.backend.repository.OrderRepository;
import com.thunderfood.backend.repository.OrderStatusHistoryRepository;
import com.thunderfood.backend.repository.PaymentRepository;
import com.thunderfood.backend.service.impl.SepayPaymentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SepayPaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private SepayPaymentServiceImpl sepayPaymentService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(sepayPaymentService, "sepayEnabled", true);
        ReflectionTestUtils.setField(sepayPaymentService, "sandboxMode", false);
        ReflectionTestUtils.setField(sepayPaymentService, "secretKey", "test-secret-key-001");
    }

    @Test
    @DisplayName("simulateSandboxPayment bị chặn AccessDeniedException khi sandboxMode = false")
    void simulateSandboxPayment_DisabledInProduction() {
        assertThrows(AccessDeniedException.class, () -> sepayPaymentService.simulateSandboxPayment(1L, 10L));
    }

    @Test
    @DisplayName("handleSepayGatewayIpn từ chối khi sai X-Secret-Key và chấp nhận khi tổng đơn có phần lẻ thập phân nhỏ")
    void handleSepayGatewayIpn_ValidatesSecretAndRoundedVnd() {
        SepayGatewayIpnRequest req = SepayGatewayIpnRequest.builder()
                .notificationType("ORDER_PAID")
                .order(SepayGatewayIpnRequest.IpnOrder.builder()
                        .orderInvoiceNumber("TF261127001")
                        .orderStatus("CAPTURED")
                        .orderAmount(new BigDecimal("100000"))
                        .build())
                .transaction(SepayGatewayIpnRequest.IpnTransaction.builder()
                        .transactionId("TX123")
                        .build())
                .build();

        assertThrows(UnauthorizedException.class,
                () -> sepayPaymentService.handleSepayGatewayIpn("wrong-secret", null, req));

        // Đơn lưu tổng tiền có phần lẻ .25 -> làm tròn HALF_UP thành 100000đ -> khớp với số tiền SePay trả về
        Order order = Order.builder()
                .id(10L)
                .orderCode("TF261127001")
                .status("PENDING")
                .paymentMethod("SEPAY")
                .paymentStatus("UNPAID")
                .totalAmount(new BigDecimal("100000.25"))
                .build();

        when(paymentRepository.existsByTransactionCodeAndStatus("SEPAY-PG-TX123", "SUCCESS")).thenReturn(false);
        when(orderRepository.findByOrderCode("TF261127001")).thenReturn(Optional.of(order));
        when(orderRepository.findByIdWithLock(10L)).thenReturn(Optional.of(order));

        Map<String, Object> result = sepayPaymentService.handleSepayGatewayIpn("test-secret-key-001", null, req);

        assertEquals(true, result.get("success"));
        assertEquals("PAID", order.getPaymentStatus());
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("getMyPayments trả về danh sách lịch sử thanh toán phân trang")
    void getMyPayments_Success() {
        Order order = Order.builder().id(10L).orderCode("TF261127001").build();
        Payment payment = Payment.builder()
                .id(1L)
                .order(order)
                .provider("SEPAY")
                .amount(new BigDecimal("100000"))
                .status("SUCCESS")
                .createdAt(LocalDateTime.now())
                .build();

        when(paymentRepository.findByOrderUserIdOrderByCreatedAtDesc(1L, PageRequest.of(0, 10)))
                .thenReturn(new PageImpl<>(List.of(payment)));

        PageResponse<PaymentHistoryResponse> resp = sepayPaymentService.getMyPayments(1L, PageRequest.of(0, 10));

        assertEquals(1, resp.getContent().size());
        assertEquals("SEPAY", resp.getContent().get(0).getProvider());
    }
}
