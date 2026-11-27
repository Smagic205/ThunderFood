package com.thunderfood.backend.service;

import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.entity.OrderItem;
import com.thunderfood.backend.entity.OrderStatusHistory;
import com.thunderfood.backend.entity.Product;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.repository.OrderRepository;
import com.thunderfood.backend.repository.OrderStatusHistoryRepository;
import com.thunderfood.backend.repository.ProductRepository;
import com.thunderfood.backend.scheduler.UnpaidSepayOrderCleanupScheduler;
import com.thunderfood.backend.scheduler.UnpaidSepayOrderCleanupService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UnpaidSepayOrderCleanupTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private VoucherService voucherService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private UnpaidSepayOrderCleanupService cleanupService;

    @Test
    @DisplayName("cancelExpiredUnpaidOrder hủy đơn SEPAY quá hạn, hoàn kho và hoàn voucher")
    void cancelExpiredUnpaidOrder_RestocksAndRevertsVouchers() {
        User customer = User.builder().id(1L).build();
        Product product = Product.builder().id(10L).stockQuantity(5).soldCount(3).build();
        Order order = Order.builder()
                .id(100L)
                .orderCode("TF_SEPAY_01")
                .user(customer)
                .paymentMethod("SEPAY")
                .paymentStatus("UNPAID")
                .status("PENDING")
                .items(List.of(OrderItem.builder().product(product).quantity(2).build()))
                .build();

        when(orderRepository.findByIdWithLock(100L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(productRepository.findByIdWithLock(10L)).thenReturn(Optional.of(product));

        boolean result = cleanupService.cancelExpiredUnpaidOrder(100L, 15);

        assertTrue(result);
        assertEquals("CANCELLED", order.getStatus());
        assertEquals("FAILED", order.getPaymentStatus());
        assertEquals(7, product.getStockQuantity());
        assertEquals(1, product.getSoldCount());
        verify(voucherService).revertVoucherUsage(order);
        verify(orderStatusHistoryRepository).save(any(OrderStatusHistory.class));
        verify(notificationService).sendNotification(eq(customer), anyString(), anyString(), eq("ORDER_STATUS"));
    }

    @Test
    @DisplayName("cancelExpiredUnpaidOrder bỏ qua nếu đơn vừa được webhook đánh dấu PAID trước khi khóa")
    void cancelExpiredUnpaidOrder_SkipsWhenAlreadyPaid() {
        Order paidOrder = Order.builder()
                .id(101L)
                .paymentMethod("SEPAY")
                .paymentStatus("PAID")
                .status("PENDING")
                .build();
        when(orderRepository.findByIdWithLock(101L)).thenReturn(Optional.of(paidOrder));

        boolean result = cleanupService.cancelExpiredUnpaidOrder(101L, 15);

        assertFalse(result);
        verify(orderRepository, never()).save(any());
        verify(voucherService, never()).revertVoucherUsage(any());
    }

    @Test
    @DisplayName("UnpaidSepayOrderCleanupScheduler gọi service xử lý từng đơn SEPAY quá hạn")
    void scheduler_ProcessesExpiredOrders() {
        UnpaidSepayOrderCleanupService mockService = mock(UnpaidSepayOrderCleanupService.class);
        UnpaidSepayOrderCleanupScheduler scheduler = new UnpaidSepayOrderCleanupScheduler(orderRepository, mockService);

        Order o1 = Order.builder().id(1L).build();
        Order o2 = Order.builder().id(2L).build();
        when(orderRepository.findByPaymentMethodAndPaymentStatusAndStatusAndCreatedAtBefore(
                eq("SEPAY"), eq("UNPAID"), eq("PENDING"), any(LocalDateTime.class)))
                .thenReturn(List.of(o1, o2));
        when(mockService.cancelExpiredUnpaidOrder(1L, 15L)).thenReturn(true);
        when(mockService.cancelExpiredUnpaidOrder(2L, 15L)).thenReturn(false);

        int cancelled = scheduler.cancelExpiredUnpaidOrders();

        assertEquals(1, cancelled);
        verify(mockService).cancelExpiredUnpaidOrder(1L, 15L);
        verify(mockService).cancelExpiredUnpaidOrder(2L, 15L);
    }
}
