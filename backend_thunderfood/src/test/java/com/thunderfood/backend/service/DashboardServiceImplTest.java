package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.dashboard.DashboardSummaryResponse;
import com.thunderfood.backend.dto.dashboard.ShipperPerformanceResponse;
import com.thunderfood.backend.entity.DeliveryPackage;
import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.repository.DeliveryPackageRepository;
import com.thunderfood.backend.repository.OrderItemRepository;
import com.thunderfood.backend.repository.OrderRepository;
import com.thunderfood.backend.repository.UserRepository;
import com.thunderfood.backend.service.impl.DashboardServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private DeliveryPackageRepository deliveryPackageRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    @Test
    @DisplayName("getSummary tính đúng tổng quan doanh thu và số đơn theo trạng thái")
    void getSummary_CalculatesTotals() {
        when(orderRepository.calculateTotalRevenue(any(), any()))
                .thenReturn(new BigDecimal("500000"))
                .thenReturn(new BigDecimal("250000"));
        when(orderRepository.countOrdersByStatus(any(), any()))
                .thenReturn(List.of(new Object[]{"DELIVERED", 4L}, new Object[]{"PENDING", 1L}));
        when(userRepository.countByCreatedAtBetween(any(), any())).thenReturn(3L);

        DashboardSummaryResponse summary = dashboardService.getSummary("TODAY", null, null);

        assertEquals(new BigDecimal("500000"), summary.getTotalRevenue());
        assertEquals(100.0, summary.getRevenueGrowthRate());
        assertEquals(5L, summary.getTotalOrders());
        assertEquals(3L, summary.getNewCustomersCount());
    }

    @Test
    @DisplayName("getShipperPerformance batch-load đơn hàng bằng findByDeliveryPackageIdIn tránh N+1")
    void getShipperPerformance_UsesBatchOrderQuery() {
        User staff = User.builder().id(5L).fullName("Shipper A").email("ship@tf.vn").phone("0900").build();
        LocalDateTime created = LocalDateTime.of(2026, 11, 20, 10, 0);
        DeliveryPackage dp = DeliveryPackage.builder().id(11L).shippedByStaff(staff).createdAt(created).build();
        Order delivered = Order.builder().id(1L).deliveryPackage(dp).status("DELIVERED").deliveredAt(created.plusMinutes(25)).build();

        when(deliveryPackageRepository.findByShippedByStaffIsNotNullAndCreatedAtBetween(any(), any())).thenReturn(List.of(dp));
        when(orderRepository.findByDeliveryPackageIdIn(List.of(11L))).thenReturn(List.of(delivered));

        List<ShipperPerformanceResponse> res = dashboardService.getShipperPerformance(
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 27)
        );

        assertEquals(1, res.size());
        assertEquals(1, res.get(0).getDeliveredOrders());
        assertEquals(100.0, res.get(0).getSuccessRate());
        verify(orderRepository, times(1)).findByDeliveryPackageIdIn(List.of(11L));
        verify(orderRepository, never()).findByDeliveryPackageId(any());
    }
}
