package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.order.*;
import com.thunderfood.backend.dto.voucher.VoucherCheckResponse;
import com.thunderfood.backend.dto.voucher.VoucherClientResponse;
import com.thunderfood.backend.entity.*;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.*;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductImageRepository productImageRepository;

    @Mock
    private SystemSettingRepository systemSettingRepository;

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VoucherService voucherService;

    @InjectMocks
    private OrderService orderService;

    private User user;
    private Cart cart;
    private Address address;
    private ServiceWard ward;
    private Product product1;
    private Product product2;
    private CartItem cartItem1;
    private CartItem cartItem2;
    private Voucher productVoucher;
    private Voucher shippingVoucher;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).fullName("Nguyễn Văn A").phone("0987654321").build();

        ward = ServiceWard.builder()
                .id(10)
                .wardName("Yên Lãng")
                .type("PHUONG")
                .shippingFee(new BigDecimal("20000.00"))
                .isActive(true)
                .build();

        address = Address.builder()
                .id(100L)
                .user(user)
                .receiverName("Nguyễn Văn A")
                .phone("0987654321")
                .detailAddress("Số 120, Ngõ 5")
                .ward(ward)
                .isDefault(true)
                .build();

        cart = Cart.builder().id(50L).user(user).build();

        product1 = Product.builder()
                .id(101L)
                .name("Cơm gà Hội An")
                .slug("com-ga-hoi-an")
                .price(new BigDecimal("60000.00"))
                .stockQuantity(20)
                .soldCount(10)
                .isAvailable(true)
                .build();

        product2 = Product.builder()
                .id(102L)
                .name("Trà sữa trân châu")
                .slug("tra-sua-tran-chau")
                .price(new BigDecimal("30000.00"))
                .discountPrice(new BigDecimal("25000.00"))
                .stockQuantity(15)
                .soldCount(50)
                .isAvailable(true)
                .build();

        cartItem1 = CartItem.builder().id(1L).cart(cart).product(product1).quantity(2).build(); // 60k * 2 = 120k
        cartItem2 = CartItem.builder().id(2L).cart(cart).product(product2).quantity(2).build(); // 25k * 2 = 50k
        // Subtotal = 170.000đ

        productVoucher = Voucher.builder()
                .id(201L)
                .code("DISCOUNT20")
                .voucherType("PRODUCT")
                .discountType("FIXED_AMOUNT")
                .discountValue(new BigDecimal("20000.00"))
                .build();

        shippingVoucher = Voucher.builder()
                .id(202L)
                .code("FREESHIP15")
                .voucherType("SHIPPING")
                .discountType("FIXED_AMOUNT")
                .discountValue(new BigDecimal("15000.00"))
                .build();
    }

    // =========================================================================
    // 1. PREVIEW CHECKOUT TESTS
    // =========================================================================

    @Test
    @DisplayName("previewCheckout ném ngoại lệ khi giỏ hàng trống")
    void testPreviewCheckout_EmptyCart() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartId(50L)).thenReturn(Collections.emptyList());

        CheckoutPreviewRequest req = CheckoutPreviewRequest.builder().addressId(100L).build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> orderService.previewCheckout(1L, req));

        assertTrue(ex.getMessage().contains("Giỏ hàng của bạn đang trống"));
    }

    @Test
    @DisplayName("previewCheckout tính đúng phí ship gốc theo phường và phí ship khi chưa đạt ngưỡng freeship")
    void testPreviewCheckout_BelowThreshold_CalculatesWardFee() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartId(50L)).thenReturn(List.of(cartItem1, cartItem2)); // 170k < 200k
        when(addressRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(address));
        when(systemSettingRepository.findBySettingKey("FREE_SHIPPING_THRESHOLD"))
                .thenReturn(Optional.of(SystemSetting.builder().settingValue("200000").build()));

        CheckoutPreviewRequest req = CheckoutPreviewRequest.builder().addressId(100L).build();
        CheckoutPreviewResponse resp = orderService.previewCheckout(1L, req);

        assertNotNull(resp);
        assertEquals(new BigDecimal("170000.00"), resp.getSubtotalAmount());
        assertEquals(new BigDecimal("20000.00"), resp.getOriginalShippingFee());
        assertEquals(BigDecimal.ZERO, resp.getThresholdShippingDiscount());
        assertEquals(new BigDecimal("20000.00"), resp.getFinalShippingFee());
        assertFalse(resp.isFreeShippingByThreshold());
        assertEquals(new BigDecimal("30000.00"), resp.getAmountNeededForFreeShip()); // 200k - 170k = 30k
        assertEquals(new BigDecimal("190000.00"), resp.getTotalAmount()); // 170k + 20k
    }

    @Test
    @DisplayName("previewCheckout tự động miễn phí ship khi tiền món >= ngưỡng FREE_SHIPPING_THRESHOLD")
    void testPreviewCheckout_AboveThreshold_FreeShipping() {
        // Mua thêm 1 phần cơm gà (120k + 60k = 180k + 50k = 230k >= 200k)
        cartItem1.setQuantity(3); // 60k * 3 = 180k

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartId(50L)).thenReturn(List.of(cartItem1, cartItem2)); // 180k + 50k = 230k
        when(addressRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(address));
        when(systemSettingRepository.findBySettingKey("FREE_SHIPPING_THRESHOLD"))
                .thenReturn(Optional.of(SystemSetting.builder().settingValue("200000").build()));

        CheckoutPreviewRequest req = CheckoutPreviewRequest.builder().addressId(100L).build();
        CheckoutPreviewResponse resp = orderService.previewCheckout(1L, req);

        assertNotNull(resp);
        assertEquals(new BigDecimal("230000.00"), resp.getSubtotalAmount());
        assertEquals(new BigDecimal("20000.00"), resp.getOriginalShippingFee());
        assertEquals(new BigDecimal("20000.00"), resp.getThresholdShippingDiscount());
        assertEquals(BigDecimal.ZERO, resp.getFinalShippingFee());
        assertTrue(resp.isFreeShippingByThreshold());
        assertEquals(new BigDecimal("230000.00"), resp.getTotalAmount()); // 230k + 0k
    }

    @Test
    @DisplayName("previewCheckout áp dụng voucher giảm ship: phần giảm >= phí ship thì phí ship = 0, nhỏ hơn thì trừ đi")
    void testPreviewCheckout_WithShippingVoucher_PartiallyAndFullyDiscounted() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartId(50L)).thenReturn(List.of(cartItem1, cartItem2)); // 170k
        when(addressRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(address));
        when(systemSettingRepository.findBySettingKey("FREE_SHIPPING_THRESHOLD"))
                .thenReturn(Optional.of(SystemSetting.builder().settingValue("200000").build()));

        // Phí ship gốc = 20k, voucher giảm 15k -> phí ship còn 5k
        VoucherCheckResponse checkShip = VoucherCheckResponse.builder()
                .valid(true)
                .voucherType("SHIPPING")
                .discountAmount(new BigDecimal("15000.00"))
                .voucher(VoucherClientResponse.builder().code("FREESHIP15").build())
                .build();

        when(voucherService.checkVoucherEligibility(eq("FREESHIP15"), eq(1L), any(BigDecimal.class), any(BigDecimal.class)))
                .thenReturn(checkShip);

        CheckoutPreviewRequest req = CheckoutPreviewRequest.builder()
                .addressId(100L)
                .shippingVoucherCode("FREESHIP15")
                .build();

        CheckoutPreviewResponse resp = orderService.previewCheckout(1L, req);

        assertNotNull(resp);
        assertEquals(new BigDecimal("15000.00"), resp.getVoucherShippingDiscount());
        assertEquals(new BigDecimal("5000.00"), resp.getFinalShippingFee()); // 20k - 15k = 5k
        assertEquals(new BigDecimal("175000.00"), resp.getTotalAmount()); // 170k + 5k
    }

    @Test
    @DisplayName("previewCheckout áp dụng đồng thời cả voucher món và voucher ship")
    void testPreviewCheckout_WithBothProductAndShippingVouchers() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartId(50L)).thenReturn(List.of(cartItem1, cartItem2)); // 170k
        when(addressRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(address));
        when(systemSettingRepository.findBySettingKey("FREE_SHIPPING_THRESHOLD"))
                .thenReturn(Optional.of(SystemSetting.builder().settingValue("200000").build()));

        // Voucher Ship giảm 15k
        VoucherCheckResponse checkShip = VoucherCheckResponse.builder()
                .valid(true)
                .voucherType("SHIPPING")
                .discountAmount(new BigDecimal("15000.00"))
                .build();
        when(voucherService.checkVoucherEligibility(eq("FREESHIP15"), eq(1L), any(), any()))
                .thenReturn(checkShip);

        // Voucher Món giảm 20k
        VoucherCheckResponse checkProduct = VoucherCheckResponse.builder()
                .valid(true)
                .voucherType("PRODUCT")
                .discountAmount(new BigDecimal("20000.00"))
                .build();
        when(voucherService.checkVoucherEligibility(eq("DISCOUNT20"), eq(1L), any(), any()))
                .thenReturn(checkProduct);

        CheckoutPreviewRequest req = CheckoutPreviewRequest.builder()
                .addressId(100L)
                .shippingVoucherCode("FREESHIP15")
                .productVoucherCode("DISCOUNT20")
                .build();

        CheckoutPreviewResponse resp = orderService.previewCheckout(1L, req);

        assertEquals(new BigDecimal("170000.00"), resp.getSubtotalAmount());
        assertEquals(new BigDecimal("20000.00"), resp.getDiscountAmount());
        assertEquals(new BigDecimal("5000.00"), resp.getFinalShippingFee());
        // Total = 170k - 20k + 5k = 155.000đ
        assertEquals(new BigDecimal("155000.00"), resp.getTotalAmount());
    }

    // =========================================================================
    // 2. PLACE ORDER TESTS
    // =========================================================================

    @Test
    @DisplayName("placeOrder ném ngoại lệ khi món hết hàng hoặc không đủ tồn kho")
    void testPlaceOrder_OutOfStock() {
        product1.setStockQuantity(1); // Trong giỏ muốn mua 2 mà kho chỉ còn 1

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartId(50L)).thenReturn(List.of(cartItem1));
        when(addressRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(address));

        PlaceOrderRequest req = PlaceOrderRequest.builder()
                .addressId(100L)
                .paymentMethod("COD")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> orderService.placeOrder(1L, req));

        assertTrue(ex.getMessage().contains("không đủ số lượng tồn kho"));
    }

    @Test
    @DisplayName("placeOrder ném ngoại lệ khi món ăn đã ngừng kinh doanh (isAvailable = false)")
    void testPlaceOrder_ProductNotAvailable() {
        product1.setIsAvailable(false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartId(50L)).thenReturn(List.of(cartItem1));
        when(addressRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(address));

        PlaceOrderRequest req = PlaceOrderRequest.builder()
                .addressId(100L)
                .paymentMethod("COD")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> orderService.placeOrder(1L, req));

        assertTrue(ex.getMessage().contains("đã ngừng kinh doanh"));
    }

    @Test
    @DisplayName("placeOrder thành công: trừ tồn kho, xóa giỏ hàng, lưu OrderItem và OrderStatusHistory")
    void testPlaceOrder_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartId(50L)).thenReturn(List.of(cartItem1)); // 60k * 2 = 120k
        when(addressRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(address));
        when(systemSettingRepository.findBySettingKey("FREE_SHIPPING_THRESHOLD"))
                .thenReturn(Optional.of(SystemSetting.builder().settingValue("200000").build()));

        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(10L);
            return o;
        });

        when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(inv -> inv.getArgument(0));

        PlaceOrderRequest req = PlaceOrderRequest.builder()
                .addressId(100L)
                .paymentMethod("COD")
                .note("Giao nhanh giúp mình nhé")
                .build();

        int initialStock = product1.getStockQuantity();
        int initialSold = product1.getSoldCount();

        OrderResponse resp = orderService.placeOrder(1L, req);

        assertNotNull(resp);
        assertEquals(10L, resp.getId());
        assertEquals("PENDING", resp.getStatus());
        assertEquals("COD", resp.getPaymentMethod());
        assertEquals(new BigDecimal("120000.00"), resp.getSubtotalAmount());
        assertEquals(new BigDecimal("20000.00"), resp.getShippingFee());
        assertEquals(new BigDecimal("140000.00"), resp.getTotalAmount()); // 120k + 20k

        // Kiểm tra tồn kho đã bị trừ và lượt bán tăng
        assertEquals(initialStock - 2, product1.getStockQuantity());
        assertEquals(initialSold + 2, product1.getSoldCount());
        verify(productRepository).save(product1);

        // Kiểm tra lịch sử trạng thái ban đầu được ghi
        verify(orderStatusHistoryRepository).save(any(OrderStatusHistory.class));

        // Kiểm tra giỏ hàng bị xóa
        verify(cartItemRepository).deleteByCartId(50L);
    }

    // =========================================================================
    // 3. ORDER HISTORY & TRACKING TESTS
    // =========================================================================

    @Test
    @DisplayName("getUserOrders trả về danh sách đơn hàng có phân trang")
    void testGetUserOrders() {
        Pageable pageable = PageRequest.of(0, 10);
        Order mockOrder = Order.builder()
                .id(1L)
                .orderCode("TF261101123456")
                .status("PENDING")
                .totalAmount(new BigDecimal("140000.00"))
                .items(Collections.emptyList())
                .build();

        when(orderRepository.findByUserIdOrderByCreatedAtDesc(1L, pageable))
                .thenReturn(new PageImpl<>(List.of(mockOrder)));

        PageResponse<OrderListResponse> result = orderService.getUserOrders(1L, null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getPagination().getTotalElements());
        assertEquals("TF261101123456", result.getContent().get(0).getOrderCode());
    }

    @Test
    @DisplayName("getOrderTracking trả về thông tin tiến trình và timeline lịch sử")
    void testGetOrderTracking() {
        Order mockOrder = Order.builder()
                .id(1L)
                .orderCode("TF261101123456")
                .status("DELIVERING")
                .build();

        OrderStatusHistory h1 = OrderStatusHistory.builder()
                .id(1L)
                .status("PENDING")
                .note("Đặt đơn thành công")
                .build();

        OrderStatusHistory h2 = OrderStatusHistory.builder()
                .id(2L)
                .status("DELIVERING")
                .note("Đang giao hàng")
                .build();

        when(orderRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(mockOrder));
        when(orderStatusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(1L)).thenReturn(List.of(h1, h2));

        OrderTrackingResponse tracking = orderService.getOrderTracking(1L, 1L);

        assertNotNull(tracking);
        assertEquals("TF261101123456", tracking.getOrderCode());
        assertEquals("DELIVERING", tracking.getCurrentStatus());
        assertEquals(2, tracking.getTimeline().size());
    }

    // =========================================================================
    // 4. CANCEL ORDER TESTS
    // =========================================================================

    @Test
    @DisplayName("cancelOrder thành công khi đơn ở trạng thái PENDING: hoàn tồn kho và hoàn voucher")
    void testCancelOrder_Pending_Success() {
        OrderItem item = OrderItem.builder()
                .product(product1)
                .quantity(2)
                .build();

        Order order = Order.builder()
                .id(10L)
                .orderCode("TF261101123456")
                .user(user)
                .status("PENDING")
                .items(List.of(item))
                .build();

        when(orderRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(order));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        CancelOrderRequest req = CancelOrderRequest.builder().reason("Đổi ý không muốn mua nữa").build();

        int stockBefore = product1.getStockQuantity();
        int soldBefore = product1.getSoldCount();

        OrderResponse resp = orderService.cancelOrder(1L, 10L, req);

        assertNotNull(resp);
        assertEquals("CANCELLED", order.getStatus());

        // Kiểm tra tồn kho được cộng lại, soldCount giảm
        assertEquals(stockBefore + 2, product1.getStockQuantity());
        assertEquals(soldBefore - 2, product1.getSoldCount());
        verify(productRepository).save(product1);

        // Kiểm tra hoàn lại lượt voucher
        verify(voucherService).revertVoucherUsage(order);

        // Kiểm tra ghi nhận lịch sử CANCELLED
        verify(orderStatusHistoryRepository).save(any(OrderStatusHistory.class));
    }

    @Test
    @DisplayName("cancelOrder ném ngoại lệ khi đơn đã CONFIRMED hoặc DELIVERING")
    void testCancelOrder_NotPending_ThrowsException() {
        Order order = Order.builder()
                .id(10L)
                .orderCode("TF261101123456")
                .user(user)
                .status("CONFIRMED") // Đã xác nhận
                .build();

        when(orderRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(order));

        CancelOrderRequest req = CancelOrderRequest.builder().reason("Muốn hủy đơn").build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> orderService.cancelOrder(1L, 10L, req));

        assertTrue(ex.getMessage().contains("đã được cửa hàng tiếp nhận/xử lý nên không thể tự hủy"));
    }
}
