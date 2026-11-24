package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.dto.admin.AdminOrderResponse;
import com.thunderfood.backend.dto.admin.UpdateOrderStatusRequest;
import com.thunderfood.backend.entity.*;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.*;
import com.thunderfood.backend.service.AdminOrderService;
import com.thunderfood.backend.service.NotificationService;
import com.thunderfood.backend.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminOrderServiceImpl implements AdminOrderService {

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final ProductRepository productRepository;
    private final VoucherService voucherService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    @Transactional(readOnly = true)
    public List<AdminOrderResponse> getAllOrders(String status, String search) {
        List<Order> orders = orderRepository.findAll();

        return orders.stream()
                .filter(o -> {
                    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim())) {
                        if (!status.trim().equalsIgnoreCase(o.getStatus())) {
                            return false;
                        }
                    }
                    if (search != null && !search.isBlank()) {
                        String q = search.trim().toLowerCase();
                        boolean matchCode = o.getOrderCode() != null && o.getOrderCode().toLowerCase().contains(q);
                        boolean matchReceiver = o.getReceiverName() != null && o.getReceiverName().toLowerCase().contains(q);
                        boolean matchPhone = o.getReceiverPhone() != null && o.getReceiverPhone().contains(q);
                        boolean matchCustomer = o.getUser() != null && o.getUser().getFullName() != null && o.getUser().getFullName().toLowerCase().contains(q);
                        if (!matchCode && !matchReceiver && !matchPhone && !matchCustomer) {
                            return false;
                        }
                    }
                    return true;
                })
                .sorted((a, b) -> {
                    LocalDateTime t1 = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN;
                    LocalDateTime t2 = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN;
                    return t2.compareTo(t1);
                })
                .map(this::mapToAdminOrderResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminOrderResponse getOrderByCode(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseGet(() -> {
                    try {
                        Long id = Long.parseLong(orderCode);
                        return orderRepository.findById(id).orElse(null);
                    } catch (NumberFormatException e) {
                        return null;
                    }
                });

        if (order == null) {
            throw new ResourceNotFoundException("Không tìm thấy đơn hàng với mã: " + orderCode);
        }

        return mapToAdminOrderResponse(order);
    }

    @Override
    @Transactional
    public AdminOrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request, Long adminId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        String oldStatus = order.getStatus();
        String newStatus = request.getStatus().trim().toUpperCase();

        if (oldStatus.equalsIgnoreCase(newStatus)) {
            return mapToAdminOrderResponse(order);
        }

        User adminUser = adminId != null ? userRepository.findById(adminId).orElse(null) : null;

        // Nếu chuyển sang CANCELLED: hoàn kho & hoàn voucher
        if ("CANCELLED".equals(newStatus)) {
            revertStockAndVoucher(order);
        } else if ("DELIVERED".equals(newStatus)) {
            order.setDeliveredAt(LocalDateTime.now());
            order.setPaymentStatus("PAID");
        }

        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);

        String note = (request.getNote() != null && !request.getNote().isBlank())
                ? request.getNote().trim()
                : "Quản trị viên cập nhật trạng thái đơn thành " + newStatus;

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(savedOrder)
                .status(newStatus)
                .note(note)
                .changedBy(adminUser)
                .build();
        orderStatusHistoryRepository.save(history);

        if (savedOrder.getUser() != null) {
            notificationService.sendNotification(
                    savedOrder.getUser(),
                    "Cập nhật trạng thái đơn hàng",
                    "Đơn hàng " + savedOrder.getOrderCode() + " đã được cập nhật trạng thái: " + newStatus,
                    "ORDER"
            );
        }

        log.info("Admin ID={} cập nhật trạng thái đơn ID={} từ {} sang {}", adminId, orderId, oldStatus, newStatus);
        return mapToAdminOrderResponse(savedOrder);
    }

    @Override
    @Transactional
    public AdminOrderResponse cancelOrder(Long orderId, String reason, Long adminId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        if ("CANCELLED".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalStateException("Đơn hàng này đã được hủy trước đó");
        }
        if ("DELIVERED".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalStateException("Không thể hủy đơn hàng đã giao thành công");
        }

        User adminUser = adminId != null ? userRepository.findById(adminId).orElse(null) : null;

        revertStockAndVoucher(order);

        order.setStatus("CANCELLED");
        Order savedOrder = orderRepository.save(order);

        String cancelNote = "Quản trị viên hủy đơn: " + (reason != null ? reason.trim() : "Không có lý do");
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(savedOrder)
                .status("CANCELLED")
                .note(cancelNote)
                .changedBy(adminUser)
                .build();
        orderStatusHistoryRepository.save(history);

        if (savedOrder.getUser() != null) {
            notificationService.sendNotification(
                    savedOrder.getUser(),
                    "Đơn hàng đã bị hủy",
                    "Đơn hàng " + savedOrder.getOrderCode() + " đã bị hủy bởi quản trị viên. Lý do: " + (reason != null ? reason : "Liên hệ hỗ trợ"),
                    "ORDER"
            );
        }

        log.info("Admin ID={} hủy đơn ID={} với lý do='{}'", adminId, orderId, reason);
        return mapToAdminOrderResponse(savedOrder);
    }

    private void revertStockAndVoucher(Order order) {
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
        voucherService.revertVoucherUsage(order);
    }

    private AdminOrderResponse mapToAdminOrderResponse(Order order) {
        List<AdminOrderResponse.OrderItemDto> items = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                items.add(AdminOrderResponse.OrderItemDto.builder()
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .productPrice(item.getProductPrice())
                        .quantity(item.getQuantity())
                        .lineTotal(item.getLineTotal())
                        .build());
            }
        }

        List<AdminOrderResponse.OrderHistoryDto> history = new ArrayList<>();
        List<OrderStatusHistory> historyEntities = orderStatusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(order.getId());
        if (historyEntities != null) {
            for (OrderStatusHistory h : historyEntities) {
                history.add(AdminOrderResponse.OrderHistoryDto.builder()
                        .status(h.getStatus())
                        .createdAt(h.getCreatedAt() != null ? h.getCreatedAt().format(DATE_FORMATTER) : null)
                        .note(h.getNote())
                        .build());
            }
        }

        AdminOrderResponse.PackageInfoDto pkgInfo = null;
        if (order.getDeliveryPackage() != null) {
            DeliveryPackage pkg = order.getDeliveryPackage();
            String pkgStatus = "PENDING".equalsIgnoreCase(pkg.getStatus()) ? "UNASSIGNED" : pkg.getStatus();
            Long staffId = pkg.getShippedByStaff() != null ? pkg.getShippedByStaff().getId() : null;
            String staffName = pkg.getShippedByStaff() != null ? pkg.getShippedByStaff().getFullName() : null;
            pkgInfo = AdminOrderResponse.PackageInfoDto.builder()
                    .id(pkg.getId())
                    .code(pkg.getPackageName())
                    .status(pkgStatus)
                    .staffId(staffId)
                    .staffName(staffName)
                    .build();
        }

        BigDecimal origShip = order.getOriginalShippingFee() != null ? order.getOriginalShippingFee() : BigDecimal.ZERO;
        BigDecimal actShip = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
        BigDecimal discountShipping = origShip.subtract(actShip).max(BigDecimal.ZERO);

        return AdminOrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser() != null ? order.getUser().getId() : null)
                .customer(order.getUser() != null ? order.getUser().getFullName() : order.getReceiverName())
                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .shippingAddress(order.getShippingAddress())
                .items(items)
                .itemCount(items.size())
                .voucherProduct(order.getProductVoucher() != null ? order.getProductVoucher().getCode() : null)
                .voucherShipping(order.getShippingVoucher() != null ? order.getShippingVoucher().getCode() : null)
                .subtotalAmount(order.getSubtotalAmount())
                .discountAmount(order.getDiscountAmount())
                .discountShippingAmount(discountShipping)
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .note(order.getNote())
                .createdAt(order.getCreatedAt() != null ? order.getCreatedAt().format(DATE_FORMATTER) : null)
                .history(history)
                .packageInfo(pkgInfo)
                .txn(null)
                .build();
    }
}
