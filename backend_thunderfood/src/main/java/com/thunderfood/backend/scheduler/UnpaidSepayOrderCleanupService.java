package com.thunderfood.backend.scheduler;

import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.entity.OrderItem;
import com.thunderfood.backend.entity.OrderStatusHistory;
import com.thunderfood.backend.entity.Product;
import com.thunderfood.backend.repository.OrderRepository;
import com.thunderfood.backend.repository.OrderStatusHistoryRepository;
import com.thunderfood.backend.repository.ProductRepository;
import com.thunderfood.backend.service.NotificationService;
import com.thunderfood.backend.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UnpaidSepayOrderCleanupService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final VoucherService voucherService;
    private final NotificationService notificationService;

    /**
     * Hủy và hoàn kho một đơn SEPAY quá hạn thanh toán trong transaction độc lập.
     *
     * @return true nếu đơn đã được hủy và hoàn kho, false nếu trạng thái đơn đã thay đổi trước khi khóa.
     */
    @Transactional
    public boolean cancelExpiredUnpaidOrder(Long orderId, long expirationMinutes) {
        Order order = orderRepository.findByIdWithLock(orderId).orElse(null);
        if (order == null) {
            return false;
        }

        if (!"SEPAY".equalsIgnoreCase(order.getPaymentMethod())
                || !"UNPAID".equalsIgnoreCase(order.getPaymentStatus())
                || !"PENDING".equalsIgnoreCase(order.getStatus())) {
            return false;
        }

        order.setStatus("CANCELLED");
        order.setPaymentStatus("FAILED");
        Order savedOrder = orderRepository.save(order);

        if (savedOrder.getItems() != null && !savedOrder.getItems().isEmpty()) {
            List<OrderItem> sortedItems = new ArrayList<>(savedOrder.getItems());
            sortedItems.sort(Comparator.comparing(
                    oi -> oi.getProduct() != null && oi.getProduct().getId() != null ? oi.getProduct().getId() : Long.MAX_VALUE
            ));
            for (OrderItem item : sortedItems) {
                Product rawProduct = item.getProduct();
                if (rawProduct != null) {
                    Product product = (rawProduct.getId() != null)
                            ? productRepository.findByIdWithLock(rawProduct.getId()).orElse(rawProduct)
                            : rawProduct;
                    int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                    int currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
                    product.setStockQuantity(currentStock + qty);
                    int currentSold = product.getSoldCount() != null ? product.getSoldCount() : 0;
                    product.setSoldCount(Math.max(0, currentSold - qty));
                    productRepository.save(product);
                }
            }
        }

        voucherService.revertVoucherUsage(savedOrder);

        orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                .order(savedOrder)
                .status("CANCELLED")
                .note("Hệ thống tự động hủy đơn hàng SEPAY do quá hạn thanh toán (" + expirationMinutes + " phút)")
                .build());

        if (savedOrder.getUser() != null) {
            notificationService.sendNotification(
                    savedOrder.getUser(),
                    "Đơn hàng đã hết hạn thanh toán",
                    "Đơn hàng " + savedOrder.getOrderCode() + " đã bị tự động hủy và hoàn lại ưu đãi do quá hạn thanh toán SePay (" + expirationMinutes + " phút).",
                    "ORDER_STATUS"
            );
        }

        log.info("Đã tự động hủy & hoàn kho đơn SEPAY quá hạn: orderId={}, orderCode={}",
                savedOrder.getId(), savedOrder.getOrderCode());
        return true;
    }
}
