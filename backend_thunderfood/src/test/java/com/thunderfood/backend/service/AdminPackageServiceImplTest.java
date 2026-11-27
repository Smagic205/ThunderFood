package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.admin.AdminPackageResponse;
import com.thunderfood.backend.entity.DeliveryPackage;
import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.repository.DeliveryPackageRepository;
import com.thunderfood.backend.repository.OrderRepository;
import com.thunderfood.backend.repository.UserRepository;
import com.thunderfood.backend.service.impl.AdminPackageServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminPackageServiceImplTest {

    @Mock
    private DeliveryPackageRepository deliveryPackageRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdminPackageServiceImpl adminPackageService;

    @Test
    @DisplayName("getAllPackages lọc ở tầng DB và batch-load đơn hàng bằng findByDeliveryPackageIdInOrderByCreatedAtAsc")
    @SuppressWarnings("unchecked")
    void getAllPackages_UsesDbSpecificationAndBatchOrders() {
        DeliveryPackage pkg = DeliveryPackage.builder()
                .id(1L)
                .packageName("GOI-01")
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        Order order = Order.builder()
                .id(10L)
                .orderCode("TF10")
                .deliveryPackage(pkg)
                .totalAmount(new BigDecimal("100000"))
                .status("CONFIRMED")
                .build();

        when(deliveryPackageRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of(pkg));
        when(orderRepository.findByDeliveryPackageIdInOrderByCreatedAtAsc(List.of(1L))).thenReturn(List.of(order));

        List<AdminPackageResponse> res = adminPackageService.getAllPackages("UNASSIGNED", null, null);

        assertEquals(1, res.size());
        assertEquals("UNASSIGNED", res.get(0).getStatus());
        assertEquals(List.of("TF10"), res.get(0).getOrderCodes());
        verify(deliveryPackageRepository, never()).findAll();
        verify(orderRepository, times(1)).findByDeliveryPackageIdInOrderByCreatedAtAsc(List.of(1L));
    }

    @Test
    @DisplayName("deletePackage chặn xóa gói đang có đơn DELIVERING")
    void deletePackage_RejectsDeliveringOrders() {
        DeliveryPackage pkg = DeliveryPackage.builder().id(1L).status("DELIVERING").build();
        Order delivering = Order.builder().id(10L).status("DELIVERING").build();
        when(deliveryPackageRepository.findById(1L)).thenReturn(Optional.of(pkg));
        when(orderRepository.findByDeliveryPackageId(1L)).thenReturn(List.of(delivering));

        assertThrows(IllegalStateException.class, () -> adminPackageService.deletePackage(1L));
        verify(deliveryPackageRepository, never()).delete(any(DeliveryPackage.class));
    }

    @Test
    @DisplayName("assignStaff gán nhân viên và chuyển đơn CONFIRMED sang DELIVERING")
    void assignStaff_Success() {
        DeliveryPackage pkg = DeliveryPackage.builder().id(1L).packageName("GOI-01").status("PENDING").build();
        User staff = User.builder().id(7L).fullName("Shipper 7").build();
        Order o = Order.builder().id(20L).orderCode("TF20").status("CONFIRMED").deliveryPackage(pkg).build();

        when(deliveryPackageRepository.findById(1L)).thenReturn(Optional.of(pkg));
        when(userRepository.findById(7L)).thenReturn(Optional.of(staff));
        when(deliveryPackageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepository.findByDeliveryPackageId(1L)).thenReturn(List.of(o));
        when(orderRepository.findByDeliveryPackageIdOrderByCreatedAtAsc(1L)).thenReturn(List.of(o));

        AdminPackageResponse resp = adminPackageService.assignStaff(1L, 7L);

        assertEquals("DELIVERING", resp.getStatus());
        assertEquals("DELIVERING", o.getStatus());
    }
}
