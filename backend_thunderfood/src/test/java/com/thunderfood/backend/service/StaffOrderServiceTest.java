package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.order.CancelOrderRequest;
import com.thunderfood.backend.dto.staff.ConfirmOrderRequest;
import com.thunderfood.backend.dto.staff.DeliveryPackageResponse;
import com.thunderfood.backend.dto.staff.FailDeliveryRequest;
import com.thunderfood.backend.dto.staff.StaffOrderDetailResponse;
import com.thunderfood.backend.dto.staff.StaffOrderListResponse;
import com.thunderfood.backend.entity.*;
import com.thunderfood.backend.exception.ConflictException;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.*;
import com.thunderfood.backend.service.impl.StaffOrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StaffOrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private DeliveryPackageRepository deliveryPackageRepository;

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductImageRepository productImageRepository;

    @Mock
    private SystemSettingRepository systemSettingRepository;

    @Mock
    private ServiceWardRepository serviceWardRepository;

    @Mock
    private VoucherService voucherService;

    @InjectMocks
    private StaffOrderServiceImpl staffOrderService;

    private User staffUser;
    private Order pendingOrder;
    private Order confirmedOrder;
    private Order deliveringOrder;
    private DeliveryPackage pendingPackage;
    private ServiceWard serviceWard;
    private Address address;

    @BeforeEach
    void setUp() {
        staffUser = User.builder()
                .id(100L)
                .email("staff@thunderfood.vn")
                .fullName("Nguyễn Văn Nhân Viên")
                .phone("0987654321")
                .role(Role.builder().id(2).name("STAFF").build())
                .status("ACTIVE")
                .build();

        serviceWard = ServiceWard.builder()
                .id(1)
                .district("Đống Đa")
                .wardName("Kim Liên")
                .type("PHUONG")
                .shippingFee(BigDecimal.valueOf(15000))
                .isActive(true)
                .build();

        address = Address.builder()
                .id(1L)
                .receiverName("Trần Khách Hàng")
                .phone("0912345678")
                .ward(serviceWard)
                .detailAddress("Số 10 Ngõ 5 Yên Lãng")
                .build();

        pendingOrder = Order.builder()
                .id(1L)
                .orderCode("TF261110001")
                .status("PENDING")
                .receiverName("Trần Khách Hàng")
                .receiverPhone("0912345678")
                .shippingAddress("Số 10 Ngõ 5 Yên Lãng, Phường Kim Liên, Hà Nội")
                .address(address)
                .subtotalAmount(BigDecimal.valueOf(100000))
                .discountAmount(BigDecimal.ZERO)
                .originalShippingFee(BigDecimal.valueOf(15000))
                .shippingFee(BigDecimal.valueOf(15000))
                .totalAmount(BigDecimal.valueOf(115000))
                .paymentMethod("COD")
                .paymentStatus("UNPAID")
                .createdAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        confirmedOrder = Order.builder()
                .id(2L)
                .orderCode("TF261110002")
                .status("CONFIRMED")
                .receiverName("Lê Khách Hàng")
                .receiverPhone("0912345679")
                .shippingAddress("Số 20 Xã Đàn, Phường Kim Liên, Hà Nội")
                .address(address)
                .totalAmount(BigDecimal.valueOf(80000))
                .paymentMethod("COD")
                .paymentStatus("UNPAID")
                .createdAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        deliveringOrder = Order.builder()
                .id(3L)
                .orderCode("TF261110003")
                .status("DELIVERING")
                .receiverName("Phạm Khách Hàng")
                .receiverPhone("0912345680")
                .shippingAddress("Số 30 Láng Hạ, Đống Đa, Hà Nội")
                .address(address)
                .totalAmount(BigDecimal.valueOf(95000))
                .paymentMethod("COD")
                .paymentStatus("UNPAID")
                .createdAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        pendingPackage = DeliveryPackage.builder()
                .id(10L)
                .packageName("GOI-DONGDA-01")
                .status("PENDING")
                .maxOrders(7)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // =========================================================================
    // 1. DUYỆT ĐƠN & GỘP GÓI (confirmOrder)
    // =========================================================================

    @Test
    @DisplayName("Xác nhận đơn thành công - Tạo gói hàng mới")
    void confirmOrder_Success_NewPackage() {
        ConfirmOrderRequest request = ConfirmOrderRequest.builder()
                .packageName("GOI-NEW-01")
                .isNewPackage(true)
                .build();

        when(orderRepository.findByIdWithLock(1L)).thenReturn(Optional.of(pendingOrder));
        when(deliveryPackageRepository.existsByPackageName("GOI-NEW-01")).thenReturn(false);
        when(deliveryPackageRepository.save(any(DeliveryPackage.class))).thenAnswer(invocation -> {
            DeliveryPackage p = invocation.getArgument(0);
            p.setId(11L);
            return p;
        });
        when(userRepository.findById(staffUser.getId())).thenReturn(Optional.of(staffUser));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StaffOrderDetailResponse response = staffOrderService.confirmOrder(1L, request, staffUser.getId());

        assertNotNull(response);
        assertEquals("CONFIRMED", response.getStatus());
        assertEquals("GOI-NEW-01", response.getPackageCode());
        verify(orderStatusHistoryRepository, times(1)).save(any(OrderStatusHistory.class));
    }

    @Test
    @DisplayName("Xác nhận đơn thành công - Gộp vào gói hàng có sẵn còn chỗ")
    void confirmOrder_Success_ExistingPackage() {
        ConfirmOrderRequest request = ConfirmOrderRequest.builder()
                .packageName("GOI-DONGDA-01")
                .isNewPackage(false)
                .build();

        when(orderRepository.findByIdWithLock(1L)).thenReturn(Optional.of(pendingOrder));
        when(deliveryPackageRepository.findByPackageNameWithLock("GOI-DONGDA-01")).thenReturn(Optional.of(pendingPackage));
        when(orderRepository.countByDeliveryPackageId(pendingPackage.getId())).thenReturn(4L);
        when(userRepository.findById(staffUser.getId())).thenReturn(Optional.of(staffUser));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StaffOrderDetailResponse response = staffOrderService.confirmOrder(1L, request, staffUser.getId());

        assertNotNull(response);
        assertEquals("CONFIRMED", response.getStatus());
        assertEquals("GOI-DONGDA-01", response.getPackageCode());
    }

    @Test
    @DisplayName("Xác nhận đơn thất bại - Đơn không ở trạng thái PENDING")
    void confirmOrder_ThrowException_WhenOrderNotPending() {
        ConfirmOrderRequest request = ConfirmOrderRequest.builder()
                .packageName("GOI-DONGDA-01")
                .isNewPackage(false)
                .build();

        when(orderRepository.findByIdWithLock(2L)).thenReturn(Optional.of(confirmedOrder));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                staffOrderService.confirmOrder(2L, request, staffUser.getId())
        );

        assertTrue(ex.getMessage().contains("PENDING"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Xác nhận đơn thất bại - Gói hàng đã đầy 7 đơn")
    void confirmOrder_ThrowException_WhenPackageIsFull() {
        ConfirmOrderRequest request = ConfirmOrderRequest.builder()
                .packageName("GOI-DONGDA-01")
                .isNewPackage(false)
                .build();

        when(orderRepository.findByIdWithLock(1L)).thenReturn(Optional.of(pendingOrder));
        when(deliveryPackageRepository.findByPackageNameWithLock("GOI-DONGDA-01")).thenReturn(Optional.of(pendingPackage));
        when(orderRepository.countByDeliveryPackageId(pendingPackage.getId())).thenReturn(7L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                staffOrderService.confirmOrder(1L, request, staffUser.getId())
        );

        assertTrue(ex.getMessage().contains("đã đầy"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Xác nhận đơn thất bại - Tạo gói mới nhưng tên gói bị trùng")
    void confirmOrder_ThrowException_WhenNewPackageNameExists() {
        ConfirmOrderRequest request = ConfirmOrderRequest.builder()
                .packageName("GOI-DONGDA-01")
                .isNewPackage(true)
                .build();

        when(orderRepository.findByIdWithLock(1L)).thenReturn(Optional.of(pendingOrder));
        when(deliveryPackageRepository.existsByPackageName("GOI-DONGDA-01")).thenReturn(true);

        assertThrows(ConflictException.class, () ->
                staffOrderService.confirmOrder(1L, request, staffUser.getId())
        );
    }

    // =========================================================================
    // 2. HỦY ĐƠN TẠI QUẦY (cancelOrderByStaff)
    // =========================================================================

    @Test
    @DisplayName("Hủy đơn PENDING thành công - Hoàn tồn kho và hoàn voucher")
    void cancelOrderByStaff_Success() {
        CancelOrderRequest request = CancelOrderRequest.builder()
                .reason("Khách gọi xin hủy đơn")
                .build();

        Product product = Product.builder()
                .id(50L)
                .stockQuantity(10)
                .soldCount(5)
                .build();

        OrderItem item = OrderItem.builder()
                .id(1L)
                .product(product)
                .quantity(2)
                .productPrice(BigDecimal.valueOf(50000))
                .lineTotal(BigDecimal.valueOf(100000))
                .build();

        pendingOrder.setItems(List.of(item));

        when(orderRepository.findByIdWithLock(1L)).thenReturn(Optional.of(pendingOrder));
        when(userRepository.findById(staffUser.getId())).thenReturn(Optional.of(staffUser));
        when(productRepository.findByIdWithLock(50L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StaffOrderDetailResponse response = staffOrderService.cancelOrderByStaff(1L, request, staffUser.getId());

        assertNotNull(response);
        assertEquals("CANCELLED", response.getStatus());
        assertEquals(12, product.getStockQuantity()); // 10 + 2
        assertEquals(3, product.getSoldCount());      // 5 - 2
        verify(productRepository, times(1)).save(product);
        verify(voucherService, times(1)).revertVoucherUsage(pendingOrder);
        verify(orderStatusHistoryRepository, times(1)).save(any(OrderStatusHistory.class));
    }

    @Test
    @DisplayName("Hủy đơn tại quầy thất bại - Đơn không ở trạng thái PENDING")
    void cancelOrderByStaff_ThrowException_WhenNotPending() {
        CancelOrderRequest request = CancelOrderRequest.builder().reason("Hết món").build();
        when(orderRepository.findByIdWithLock(2L)).thenReturn(Optional.of(confirmedOrder));

        assertThrows(IllegalStateException.class, () ->
                staffOrderService.cancelOrderByStaff(2L, request, staffUser.getId())
        );
    }

    // =========================================================================
    // 3. SHIPPER NHẬN GIAO GÓI HÀNG (claimPackage)
    // =========================================================================

    @Test
    @DisplayName("Shipper nhận giao gói thành công - Đơn và gói cùng chuyển DELIVERING")
    void claimPackage_Success() {
        when(deliveryPackageRepository.existsByShippedByStaffIdAndStatus(staffUser.getId(), "DELIVERING")).thenReturn(false);
        when(deliveryPackageRepository.findByIdWithLock(10L)).thenReturn(Optional.of(pendingPackage));
        when(userRepository.findById(staffUser.getId())).thenReturn(Optional.of(staffUser));
        when(deliveryPackageRepository.save(any(DeliveryPackage.class))).thenAnswer(invocation -> invocation.getArgument(0));

        confirmedOrder.setDeliveryPackage(pendingPackage);
        when(orderRepository.findByDeliveryPackageIdOrderByCreatedAtAsc(10L)).thenReturn(List.of(confirmedOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DeliveryPackageResponse response = staffOrderService.claimPackage(10L, staffUser.getId());

        assertNotNull(response);
        assertEquals("DELIVERING", response.getStatus());
        assertEquals("DELIVERING", confirmedOrder.getStatus());
        assertEquals(staffUser.getId(), pendingPackage.getShippedByStaff().getId());
        verify(orderStatusHistoryRepository, times(1)).save(any(OrderStatusHistory.class));
    }

    @Test
    @DisplayName("Shipper nhận giao gói thất bại - Shipper đang giữ gói khác chưa giao xong")
    void claimPackage_ThrowException_WhenShipperAlreadyHoldsActivePackage() {
        when(deliveryPackageRepository.existsByShippedByStaffIdAndStatus(staffUser.getId(), "DELIVERING")).thenReturn(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                staffOrderService.claimPackage(10L, staffUser.getId())
        );

        assertTrue(ex.getMessage().contains("chưa hoàn thành"));
        verify(deliveryPackageRepository, never()).findByIdWithLock(any());
    }

    // =========================================================================
    // 4. SHIPPER GIAO HÀNG & TỰ THU COD (deliverOrder)
    // =========================================================================

    @Test
    @DisplayName("Giao hàng thành công - Tự động thu tiền mặt COD và tự hoàn tất gói khi hết đơn")
    void deliverOrder_Success_AutoCollectCod_And_AutoCompletePackage() {
        DeliveryPackage deliveringPackage = DeliveryPackage.builder()
                .id(20L)
                .packageName("GOI-DELIVERING-01")
                .status("DELIVERING")
                .shippedByStaff(staffUser)
                .build();

        deliveringOrder.setDeliveryPackage(deliveringPackage);

        when(orderRepository.findByIdWithLock(3L)).thenReturn(Optional.of(deliveringOrder));
        when(userRepository.findById(staffUser.getId())).thenReturn(Optional.of(staffUser));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Mock kiểm tra hoàn tất gói: gói này chỉ có 1 đơn này và đơn đã DELIVERED
        when(deliveryPackageRepository.findByIdWithLock(20L)).thenReturn(Optional.of(deliveringPackage));
        when(orderRepository.findByDeliveryPackageId(20L)).thenReturn(List.of(deliveringOrder));

        StaffOrderDetailResponse response = staffOrderService.deliverOrder(3L, staffUser.getId());

        assertNotNull(response);
        assertEquals("DELIVERED", response.getStatus());
        assertEquals("PAID", deliveringOrder.getPaymentStatus()); // COD tự chuyển sang PAID!
        assertNotNull(deliveringOrder.getDeliveredAt());
        assertEquals("COMPLETED", deliveringPackage.getStatus()); // Gói tự động chuyển COMPLETED!
        assertNotNull(deliveringPackage.getCompletedAt());
        verify(deliveryPackageRepository, times(1)).save(deliveringPackage);
    }

    @Test
    @DisplayName("Giao hàng thất bại - Báo hủy đơn và tự hoàn tất gói")
    void failDelivery_Success_And_AutoCompletePackage() {
        FailDeliveryRequest request = FailDeliveryRequest.builder()
                .reason("Khách boom hàng, không nghe máy 3 lần")
                .build();

        DeliveryPackage deliveringPackage = DeliveryPackage.builder()
                .id(20L)
                .packageName("GOI-DELIVERING-01")
                .status("DELIVERING")
                .shippedByStaff(staffUser)
                .build();

        deliveringOrder.setDeliveryPackage(deliveringPackage);

        when(orderRepository.findByIdWithLock(3L)).thenReturn(Optional.of(deliveringOrder));
        when(userRepository.findById(staffUser.getId())).thenReturn(Optional.of(staffUser));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        when(deliveryPackageRepository.findByIdWithLock(20L)).thenReturn(Optional.of(deliveringPackage));
        when(orderRepository.findByDeliveryPackageId(20L)).thenReturn(List.of(deliveringOrder));

        StaffOrderDetailResponse response = staffOrderService.failDelivery(3L, request, staffUser.getId());

        assertNotNull(response);
        assertEquals("CANCELLED", response.getStatus());
        assertEquals("COMPLETED", deliveringPackage.getStatus()); // Đơn hủy cũng tính là đã kết thúc -> hoàn tất gói!
    }

    // =========================================================================
    // 5. LỌC ĐA CẤP & QUERY KHU VỰC
    // =========================================================================

    @Test
    @DisplayName("Lấy danh sách các Quận/Huyện duy nhất đang phục vụ")
    void getDistricts_Success() {
        when(serviceWardRepository.findDistinctDistricts()).thenReturn(List.of("Ba Đình", "Cầu Giấy", "Đống Đa"));

        List<String> districts = staffOrderService.getDistricts();

        assertEquals(3, districts.size());
        assertEquals("Ba Đình", districts.get(0));
    }

    @Test
    @DisplayName("Lấy danh sách Phường theo Quận")
    void getWardsByDistrict_Success() {
        when(serviceWardRepository.findByDistrictIgnoreCaseAndIsActiveTrueOrderByWardNameAsc("Đống Đa"))
                .thenReturn(List.of(serviceWard));

        List<String> wards = staffOrderService.getWardsByDistrict("Đống Đa");

        assertEquals(1, wards.size());
        assertEquals("Kim Liên", wards.get(0));
    }

    @Test
    @DisplayName("Lấy danh sách đơn hàng cho Staff phân trang")
    void getStaffOrders_Success() {
        Page<Order> page = new PageImpl<>(List.of(pendingOrder), PageRequest.of(0, 10), 1);
        when(orderRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResponse<StaffOrderListResponse> response = staffOrderService.getStaffOrders(
                "PENDING", "Đống Đa", "Kim Liên", "Yên Lãng", "TF", PageRequest.of(0, 10)
        );

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("TF261110001", response.getContent().get(0).getOrderCode());
    }
}
