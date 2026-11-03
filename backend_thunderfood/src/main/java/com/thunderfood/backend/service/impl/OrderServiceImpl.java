package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.dto.address.AddressResponse;
import com.thunderfood.backend.dto.cart.CartItemResponse;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.order.*;
import com.thunderfood.backend.dto.voucher.VoucherCheckResponse;
import com.thunderfood.backend.dto.voucher.VoucherClientResponse;
import com.thunderfood.backend.entity.*;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.*;
import com.thunderfood.backend.service.OrderService;
import com.thunderfood.backend.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final AddressRepository addressRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final VoucherRepository voucherRepository;
    private final UserRepository userRepository;
    private final VoucherService voucherService;

    private static final String DEFAULT_SHIPPING_KEY = "DEFAULT_SHIPPING_FEE";
    private static final String FREE_SHIPPING_THRESHOLD_KEY = "FREE_SHIPPING_THRESHOLD";
    private static final BigDecimal FALLBACK_DEFAULT_SHIPPING = new BigDecimal("15000");
    private static final BigDecimal FALLBACK_FREE_SHIPPING_THRESHOLD = new BigDecimal("200000");

    private static final SecureRandom RANDOM = new SecureRandom();

    // =========================================================================
    // 1. PREVIEW CHECKOUT (Tính toán chi phí xem trước)
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public CheckoutPreviewResponse previewCheckout(Long userId, CheckoutPreviewRequest request) {
        Cart cart = getCartOrThrow(userId);
        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng của bạn đang trống, vui lòng thêm món trước khi thanh toán");
        }

        Address address = getAddressOrThrow(request.getAddressId(), userId);
        ServiceWard ward = validateAndGetWard(address);

        // Tính tiền món
        List<CartItemResponse> itemResponses = buildCartItemResponses(cartItems);
        BigDecimal subtotal = calculateSubtotal(cartItems);

        // Phí ship gốc theo phường
        BigDecimal originalShippingFee = (ward.getShippingFee() != null && ward.getShippingFee().compareTo(BigDecimal.ZERO) >= 0)
                ? ward.getShippingFee()
                : getSystemSettingDecimal(DEFAULT_SHIPPING_KEY, FALLBACK_DEFAULT_SHIPPING);

        // Ngưỡng miễn phí ship sàn
        BigDecimal freeShippingThreshold = getSystemSettingDecimal(FREE_SHIPPING_THRESHOLD_KEY, FALLBACK_FREE_SHIPPING_THRESHOLD);
        boolean isFreeShippingByThreshold = subtotal.compareTo(freeShippingThreshold) >= 0;

        BigDecimal thresholdShippingDiscount = BigDecimal.ZERO;
        BigDecimal shippingAfterThreshold = originalShippingFee;
        BigDecimal amountNeededForFreeShip = BigDecimal.ZERO;

        if (isFreeShippingByThreshold) {
            thresholdShippingDiscount = originalShippingFee;
            shippingAfterThreshold = BigDecimal.ZERO;
        } else {
            amountNeededForFreeShip = freeShippingThreshold.subtract(subtotal);
        }

        // Voucher Giảm Ship
        BigDecimal voucherShippingDiscount = BigDecimal.ZERO;
        VoucherClientResponse shippingVoucherResponse = null;

        if (request.getShippingVoucherCode() != null && !request.getShippingVoucherCode().isBlank()) {
            VoucherCheckResponse checkShip = voucherService.checkVoucherEligibility(
                    request.getShippingVoucherCode(),
                    userId,
                    subtotal,
                    shippingAfterThreshold
            );

            if (!checkShip.isValid()) {
                throw new IllegalArgumentException(checkShip.getMessage());
            }
            if (!"SHIPPING".equalsIgnoreCase(checkShip.getVoucherType())) {
                throw new IllegalArgumentException("Mã '" + request.getShippingVoucherCode() + "' không phải là mã giảm phí giao hàng");
            }

            voucherShippingDiscount = checkShip.getDiscountAmount();
            shippingVoucherResponse = checkShip.getVoucher();
        }

        // Phí ship thực tế = shippingAfterThreshold - voucherShippingDiscount (>= 0)
        BigDecimal finalShippingFee = shippingAfterThreshold.subtract(voucherShippingDiscount).max(BigDecimal.ZERO);

        // Voucher Giảm Món
        BigDecimal productDiscount = BigDecimal.ZERO;
        VoucherClientResponse productVoucherResponse = null;

        if (request.getProductVoucherCode() != null && !request.getProductVoucherCode().isBlank()) {
            VoucherCheckResponse checkProduct = voucherService.checkVoucherEligibility(
                    request.getProductVoucherCode(),
                    userId,
                    subtotal,
                    finalShippingFee
            );

            if (!checkProduct.isValid()) {
                throw new IllegalArgumentException(checkProduct.getMessage());
            }
            if (!"PRODUCT".equalsIgnoreCase(checkProduct.getVoucherType())) {
                throw new IllegalArgumentException("Mã '" + request.getProductVoucherCode() + "' không phải là mã giảm giá đơn hàng");
            }

            productDiscount = checkProduct.getDiscountAmount();
            productVoucherResponse = checkProduct.getVoucher();
        }

        // Tổng tiền thanh toán
        BigDecimal totalAmount = subtotal.subtract(productDiscount).add(finalShippingFee).max(BigDecimal.ZERO);

        return CheckoutPreviewResponse.builder()
                .subtotalAmount(subtotal)
                .discountAmount(productDiscount)
                .originalShippingFee(originalShippingFee)
                .thresholdShippingDiscount(thresholdShippingDiscount)
                .voucherShippingDiscount(voucherShippingDiscount)
                .finalShippingFee(finalShippingFee)
                .totalAmount(totalAmount)
                .isFreeShippingByThreshold(isFreeShippingByThreshold)
                .freeShippingThreshold(freeShippingThreshold)
                .amountNeededForFreeShip(amountNeededForFreeShip)
                .productVoucher(productVoucherResponse)
                .shippingVoucher(shippingVoucherResponse)
                .items(itemResponses)
                .shippingAddress(AddressResponse.fromEntity(address))
                .build();
    }

    // =========================================================================
    // 2. PLACE ORDER (Đặt hàng chính thức)
    // =========================================================================

    @Override
    @Transactional
    public OrderResponse placeOrder(Long userId, PlaceOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng"));

        Cart cart = getCartOrThrow(userId);
        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng của bạn đang trống, vui lòng thêm món trước khi đặt hàng");
        }

        Address address = getAddressOrThrow(request.getAddressId(), userId);
        ServiceWard ward = validateAndGetWard(address);

        // Kiểm tra tồn kho & trạng thái kinh doanh của từng món
        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            if (product == null || !Boolean.TRUE.equals(product.getIsAvailable())) {
                throw new IllegalArgumentException("Món '" + (product != null ? product.getName() : "") + "' hiện đã ngừng kinh doanh, vui lòng cập nhật giỏ hàng");
            }
            int requestedQty = item.getQuantity() != null ? item.getQuantity() : 1;
            if (product.getStockQuantity() == null || product.getStockQuantity() < requestedQty) {
                throw new IllegalArgumentException("Món '" + product.getName() + "' không đủ số lượng tồn kho (chỉ còn " + product.getStockQuantity() + " phần)");
            }
        }

        // Tính toán các khoản tiền
        BigDecimal subtotal = calculateSubtotal(cartItems);

        BigDecimal originalShippingFee = (ward.getShippingFee() != null && ward.getShippingFee().compareTo(BigDecimal.ZERO) >= 0)
                ? ward.getShippingFee()
                : getSystemSettingDecimal(DEFAULT_SHIPPING_KEY, FALLBACK_DEFAULT_SHIPPING);

        BigDecimal freeShippingThreshold = getSystemSettingDecimal(FREE_SHIPPING_THRESHOLD_KEY, FALLBACK_FREE_SHIPPING_THRESHOLD);
        boolean isFreeShippingByThreshold = subtotal.compareTo(freeShippingThreshold) >= 0;

        BigDecimal shippingAfterThreshold = isFreeShippingByThreshold ? BigDecimal.ZERO : originalShippingFee;

        // Xử lý Voucher Ship
        Voucher shippingVoucher = null;
        BigDecimal voucherShippingDiscount = BigDecimal.ZERO;
        VoucherClientResponse shippingVoucherResp = null;

        if (request.getShippingVoucherCode() != null && !request.getShippingVoucherCode().isBlank()) {
            VoucherCheckResponse checkShip = voucherService.checkVoucherEligibility(
                    request.getShippingVoucherCode(),
                    userId,
                    subtotal,
                    shippingAfterThreshold
            );
            if (!checkShip.isValid()) {
                throw new IllegalArgumentException(checkShip.getMessage());
            }
            if (!"SHIPPING".equalsIgnoreCase(checkShip.getVoucherType())) {
                throw new IllegalArgumentException("Mã '" + request.getShippingVoucherCode() + "' không phải là mã giảm phí giao hàng");
            }

            shippingVoucher = voucherRepository.findByCodeIgnoreCase(request.getShippingVoucherCode().trim()).orElse(null);
            voucherShippingDiscount = checkShip.getDiscountAmount();
            shippingVoucherResp = checkShip.getVoucher();
        }

        BigDecimal finalShippingFee = shippingAfterThreshold.subtract(voucherShippingDiscount).max(BigDecimal.ZERO);

        // Xử lý Voucher Món
        Voucher productVoucher = null;
        BigDecimal productDiscount = BigDecimal.ZERO;
        VoucherClientResponse productVoucherResp = null;

        if (request.getProductVoucherCode() != null && !request.getProductVoucherCode().isBlank()) {
            VoucherCheckResponse checkProduct = voucherService.checkVoucherEligibility(
                    request.getProductVoucherCode(),
                    userId,
                    subtotal,
                    finalShippingFee
            );
            if (!checkProduct.isValid()) {
                throw new IllegalArgumentException(checkProduct.getMessage());
            }
            if (!"PRODUCT".equalsIgnoreCase(checkProduct.getVoucherType())) {
                throw new IllegalArgumentException("Mã '" + request.getProductVoucherCode() + "' không phải là mã giảm giá đơn hàng");
            }

            productVoucher = voucherRepository.findByCodeIgnoreCase(request.getProductVoucherCode().trim()).orElse(null);
            productDiscount = checkProduct.getDiscountAmount();
            productVoucherResp = checkProduct.getVoucher();
        }

        BigDecimal totalAmount = subtotal.subtract(productDiscount).add(finalShippingFee).max(BigDecimal.ZERO);

        // Tạo chuỗi địa chỉ giao hàng snapshot
        String wardPrefix = (ward.getType() != null && ward.getType().equalsIgnoreCase("PHUONG")) ? "Phường " : "Xã ";
        String fullShippingAddress = address.getDetailAddress() + ", " + wardPrefix + ward.getWardName() + ", Hà Nội";

        // Sinh mã đơn hàng duy nhất
        String orderCode = generateOrderCode();

        // Khởi tạo Entity Order
        Order order = Order.builder()
                .orderCode(orderCode)
                .user(user)
                .address(address)
                .productVoucher(productVoucher)
                .shippingVoucher(shippingVoucher)
                .receiverName(address.getReceiverName())
                .receiverPhone(address.getPhone())
                .shippingAddress(fullShippingAddress)
                .subtotalAmount(subtotal)
                .discountAmount(productDiscount)
                .originalShippingFee(originalShippingFee)
                .shippingFee(finalShippingFee)
                .totalAmount(totalAmount)
                .status("PENDING")
                .paymentMethod(request.getPaymentMethod().trim().toUpperCase())
                .paymentStatus("UNPAID")
                .note(request.getNote())
                .build();

        Order savedOrder = orderRepository.save(order);

        // Snapshot từng món sang OrderItem & Trừ kho sản phẩm
        List<OrderItem> savedItems = new ArrayList<>();
        Map<Long, String> thumbnailMap = loadThumbnailMap(cartItems.stream().map(ci -> ci.getProduct().getId()).toList());

        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            BigDecimal effectivePrice = getEffectivePrice(product);
            int qty = item.getQuantity() != null ? item.getQuantity() : 1;
            BigDecimal lineTotal = effectivePrice.multiply(BigDecimal.valueOf(qty));

            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .product(product)
                    .productName(product.getName())
                    .productPrice(effectivePrice)
                    .quantity(qty)
                    .lineTotal(lineTotal)
                    .build();

            savedItems.add(orderItemRepository.save(orderItem));

            // Trừ kho & tăng lượt bán
            product.setStockQuantity(product.getStockQuantity() - qty);
            int currentSold = product.getSoldCount() != null ? product.getSoldCount() : 0;
            product.setSoldCount(currentSold + qty);
            productRepository.save(product);
        }

        savedOrder.setItems(savedItems);

        // Ghi nhận lượt sử dụng Voucher (nếu có)
        if (productVoucher != null) {
            voucherService.recordVoucherUsage(productVoucher, user, savedOrder, productDiscount);
        }
        if (shippingVoucher != null) {
            voucherService.recordVoucherUsage(shippingVoucher, user, savedOrder, voucherShippingDiscount);
        }

        // Ghi lịch sử trạng thái ban đầu: PENDING
        OrderStatusHistory initialHistory = OrderStatusHistory.builder()
                .order(savedOrder)
                .status("PENDING")
                .note("Khách hàng đặt đơn hàng thành công")
                .changedBy(user)
                .build();
        orderStatusHistoryRepository.save(initialHistory);

        // Dọn sạch giỏ hàng
        cartItemRepository.deleteByCartId(cart.getId());
        log.info("Đặt đơn hàng thành công: orderId={}, orderCode={}, userId={}, totalAmount={}", 
                savedOrder.getId(), savedOrder.getOrderCode(), userId, savedOrder.getTotalAmount());

        List<OrderItemResponse> itemResponses = savedItems.stream()
                .map(i -> OrderItemResponse.fromEntity(i, thumbnailMap.get(i.getProduct().getId())))
                .toList();

        return OrderResponse.fromEntity(savedOrder, itemResponses, productVoucherResp, shippingVoucherResp);
    }

    // =========================================================================
    // 3. LỊCH SỬ ĐƠN HÀNG (Order History)
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderListResponse> getUserOrders(Long userId, String status, Pageable pageable) {
        Page<Order> orderPage;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            orderPage = orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status.trim().toUpperCase(), pageable);
        } else {
            orderPage = orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        List<OrderListResponse> content = orderPage.getContent().stream().map(order -> {
            List<OrderItemResponse> previewItems = new ArrayList<>();
            if (order.getItems() != null && !order.getItems().isEmpty()) {
                List<Long> pIds = order.getItems().stream().map(i -> i.getProduct().getId()).toList();
                Map<Long, String> thumbnails = loadThumbnailMap(pIds);
                previewItems = order.getItems().stream()
                        .map(i -> OrderItemResponse.fromEntity(i, thumbnails.get(i.getProduct().getId())))
                        .toList();
            }
            return OrderListResponse.fromEntity(order, previewItems);
        }).toList();

        PaginationInfo pagination = PaginationInfo.builder()
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .hasNext(pageable.getPageNumber() + 1 < orderPage.getTotalPages())
                .hasPrevious(pageable.getPageNumber() > 0)
                .build();

        return PageResponse.<OrderListResponse>builder()
                .content(content)
                .pagination(pagination)
                .build();
    }

    // =========================================================================
    // 4. CHI TIẾT ĐƠN HÀNG (Order Detail)
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderDetail(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        List<OrderItemResponse> itemResponses = new ArrayList<>();
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            List<Long> pIds = order.getItems().stream().map(i -> i.getProduct().getId()).toList();
            Map<Long, String> thumbnails = loadThumbnailMap(pIds);
            itemResponses = order.getItems().stream()
                    .map(i -> OrderItemResponse.fromEntity(i, thumbnails.get(i.getProduct().getId())))
                    .toList();
        }

        VoucherClientResponse productVoucherResp = (order.getProductVoucher() != null)
                ? VoucherClientResponse.fromEntity(order.getProductVoucher(), true, null)
                : null;

        VoucherClientResponse shippingVoucherResp = (order.getShippingVoucher() != null)
                ? VoucherClientResponse.fromEntity(order.getShippingVoucher(), true, null)
                : null;

        return OrderResponse.fromEntity(order, itemResponses, productVoucherResp, shippingVoucherResp);
    }

    // =========================================================================
    // 5. THEO DÕI ĐƠN HÀNG (Order Tracking)
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public OrderTrackingResponse getOrderTracking(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        List<OrderStatusHistory> historyList = orderStatusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
        List<OrderStatusHistoryResponse> timeline = historyList.stream()
                .map(OrderStatusHistoryResponse::fromEntity)
                .toList();

        String shipperName = null;
        String shipperPhone = null;
        if (order.getDeliveryPackage() != null && order.getDeliveryPackage().getShippedByStaff() != null) {
            shipperName = order.getDeliveryPackage().getShippedByStaff().getFullName();
            shipperPhone = order.getDeliveryPackage().getShippedByStaff().getPhone();
        }

        return OrderTrackingResponse.builder()
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .currentStatus(order.getStatus())
                .createdAt(order.getCreatedAt())
                .deliveredAt(order.getDeliveredAt())
                .shipperName(shipperName)
                .shipperPhone(shipperPhone)
                .timeline(timeline)
                .build();
    }

    // =========================================================================
    // 6. HỦY ĐƠN HÀNG (Chỉ khi trạng thái là PENDING)
    // =========================================================================

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long userId, Long orderId, CancelOrderRequest request) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalArgumentException("Đơn hàng đang ở trạng thái '" + order.getStatus() + 
                    "', đã được cửa hàng tiếp nhận/xử lý nên không thể tự hủy. Vui lòng liên hệ nhân viên để được hỗ trợ.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng"));

        // 1. Đổi trạng thái đơn sang CANCELLED
        order.setStatus("CANCELLED");
        Order savedOrder = orderRepository.save(order);

        // 2. Ghi lịch sử trạng thái
        OrderStatusHistory cancelHistory = OrderStatusHistory.builder()
                .order(savedOrder)
                .status("CANCELLED")
                .note("Khách hàng hủy đơn: " + request.getReason().trim())
                .changedBy(user)
                .build();
        orderStatusHistoryRepository.save(cancelHistory);

        // 3. Hoàn tồn kho sản phẩm
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product != null) {
                    int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                    product.setStockQuantity(product.getStockQuantity() + qty);
                    int currentSold = product.getSoldCount() != null ? product.getSoldCount() : 0;
                    product.setSoldCount(Math.max(0, currentSold - qty));
                    productRepository.save(product);
                }
            }
        }

        // 4. Hoàn lại lượt sử dụng voucher (nếu có)
        voucherService.revertVoucherUsage(order);

        log.info("Khách hàng hủy đơn hàng thành công: orderId={}, orderCode={}, lý do='{}'", 
                orderId, order.getOrderCode(), request.getReason().trim());

        return getOrderDetail(userId, orderId);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private Cart getCartOrThrow(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng chưa có giỏ hàng"));
    }

    private Address getAddressOrThrow(Long addressId, Long userId) {
        return addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ giao hàng với ID: " + addressId));
    }

    private ServiceWard validateAndGetWard(Address address) {
        ServiceWard ward = address.getWard();
        if (ward == null || Boolean.FALSE.equals(ward.getIsActive())) {
            throw new IllegalArgumentException("Khu vực địa chỉ nhận hàng hiện tại không còn phục vụ giao hàng");
        }
        return ward;
    }

    private BigDecimal calculateSubtotal(List<CartItem> cartItems) {
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : cartItems) {
            Product p = item.getProduct();
            if (p != null) {
                BigDecimal effectivePrice = getEffectivePrice(p);
                int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                subtotal = subtotal.add(effectivePrice.multiply(BigDecimal.valueOf(qty)));
            }
        }
        return subtotal;
    }

    private BigDecimal getEffectivePrice(Product p) {
        if (p.getDiscountPrice() != null
                && p.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0
                && p.getDiscountPrice().compareTo(p.getPrice()) < 0) {
            return p.getDiscountPrice();
        }
        return p.getPrice();
    }

    private BigDecimal getSystemSettingDecimal(String key, BigDecimal fallback) {
        return systemSettingRepository.findBySettingKey(key)
                .map(setting -> {
                    try {
                        return new BigDecimal(setting.getSettingValue().trim());
                    } catch (Exception e) {
                        return fallback;
                    }
                })
                .orElse(fallback);
    }

    private List<CartItemResponse> buildCartItemResponses(List<CartItem> cartItems) {
        List<Long> productIds = cartItems.stream().map(i -> i.getProduct().getId()).toList();
        Map<Long, String> thumbnailMap = loadThumbnailMap(productIds);

        return cartItems.stream().map(item -> {
            Product p = item.getProduct();
            BigDecimal effectivePrice = getEffectivePrice(p);
            BigDecimal originalPrice = (effectivePrice.compareTo(p.getPrice()) < 0) ? p.getPrice() : null;
            int qty = item.getQuantity() != null ? item.getQuantity() : 1;

            return CartItemResponse.builder()
                    .id(item.getId())
                    .productId(p.getId())
                    .productName(p.getName())
                    .productSlug(p.getSlug())
                    .imageUrl(thumbnailMap.get(p.getId()))
                    .originalPrice(originalPrice)
                    .price(effectivePrice)
                    .quantity(qty)
                    .stockQuantity(p.getStockQuantity())
                    .isAvailable(p.getIsAvailable())
                    .subtotal(effectivePrice.multiply(BigDecimal.valueOf(qty)))
                    .build();
        }).toList();
    }

    private Map<Long, String> loadThumbnailMap(List<Long> productIds) {
        if (productIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ProductImage> images = productImageRepository.findByProductIdInOrderByPriority(productIds);
        Map<Long, String> map = new HashMap<>();
        for (ProductImage img : images) {
            map.putIfAbsent(img.getProduct().getId(), img.getImageUrl());
        }
        return map;
    }

    private String generateOrderCode() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyMMdd");
        String datePrefix = LocalDateTime.now().format(formatter);
        String code;
        do {
            int randomNum = 100000 + RANDOM.nextInt(900000);
            code = "TF" + datePrefix + randomNum;
        } while (orderRepository.existsByOrderCode(code));
        return code;
    }
}

