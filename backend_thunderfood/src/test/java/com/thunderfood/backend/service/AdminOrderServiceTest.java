package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.admin.AdminOrderResponse;
import com.thunderfood.backend.dto.admin.UpdateOrderStatusRequest;
import com.thunderfood.backend.entity.*;
import com.thunderfood.backend.repository.OrderRepository;
import com.thunderfood.backend.repository.OrderStatusHistoryRepository;
import com.thunderfood.backend.repository.ProductRepository;
import com.thunderfood.backend.repository.UserRepository;
import com.thunderfood.backend.service.impl.AdminOrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminOrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private VoucherService voucherService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdminOrderServiceImpl adminOrderService;

    private User customer;
    private User admin;
    private Product product;

    @BeforeEach
    void setUp() {
        customer = User.builder().id(1L).fullName("Khách").email("k@gmail.com").build();
        admin = User.builder().id(9L).fullName("Admin").email("admin@thunderfood.vn").build();
        product = Product.builder().id(10L).name("Cơm gà").stockQuantity(5).soldCount(3).build();
    }

    @Test
    @DisplayName("updateOrderStatus chặn chuyển ngược từ DELIVERED sang CANCELLED và từ CANCELLED sang DELIVERED")
    void updateOrderStatus_RejectsInvalidTransitions() {
        Order deliveredOrder = Order.builder().id(1L).orderCode("TF01").status("DELIVERED").user(customer).build();
        Order cancelledOrder = Order.builder().id(2L).orderCode("TF02").status("CANCELLED").user(customer).build();

        when(orderRepository.findByIdWithLock(1L)).thenReturn(Optional.of(deliveredOrder));
        when(orderRepository.findByIdWithLock(2L)).thenReturn(Optional.of(cancelledOrder));

        assertThrows(IllegalStateException.class, () ->
                adminOrderService.updateOrderStatus(1L, UpdateOrderStatusRequest.builder().status("CANCELLED").build(), 9L)
        );
        assertThrows(IllegalStateException.class, () ->
                adminOrderService.updateOrderStatus(2L, UpdateOrderStatusRequest.builder().status("DELIVERED").build(), 9L)
        );
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateOrderStatus từ chối chuỗi trạng thái không hợp lệ")
    void updateOrderStatus_RejectsUnknownStatus() {
        Order pendingOrder = Order.builder().id(1L).orderCode("TF01").status("PENDING").user(customer).build();
        when(orderRepository.findByIdWithLock(1L)).thenReturn(Optional.of(pendingOrder));

        assertThrows(IllegalArgumentException.class, () ->
                adminOrderService.updateOrderStatus(1L, UpdateOrderStatusRequest.builder().status("HACKED").build(), 9L)
        );
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateOrderStatus chuyển PENDING -> CANCELLED dùng khóa bi quan, hoàn kho và hoàn voucher")
    void updateOrderStatus_CancelFromPending_LocksProductAndReverts() {
        Order order = Order.builder()
                .id(3L)
                .orderCode("TF03")
                .status("PENDING")
                .totalAmount(new BigDecimal("100000"))
                .user(customer)
                .items(List.of(OrderItem.builder().product(product).quantity(2).build()))
                .build();

        when(orderRepository.findByIdWithLock(3L)).thenReturn(Optional.of(order));
        when(userRepository.findById(9L)).thenReturn(Optional.of(admin));
        when(productRepository.findByIdWithLock(10L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminOrderResponse response = adminOrderService.updateOrderStatus(
                3L, UpdateOrderStatusRequest.builder().status("CANCELLED").note("Hủy đơn").build(), 9L
        );

        assertEquals("CANCELLED", response.getStatus());
        assertEquals(7, product.getStockQuantity());
        assertEquals(1, product.getSoldCount());
        verify(productRepository).findByIdWithLock(10L);
        verify(voucherService).revertVoucherUsage(order);
    }
}
