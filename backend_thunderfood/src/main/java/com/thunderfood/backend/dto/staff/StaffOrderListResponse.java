package com.thunderfood.backend.dto.staff;

import com.thunderfood.backend.entity.Order;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffOrderListResponse {

    private Long id;
    private String orderCode;
    private LocalDateTime createdAt;
    private String customerName;
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private String wardName;
    private String status;
    private String paymentMethod;
    private String paymentStatus;
    private Integer totalItems;
    private BigDecimal totalAmount;
    private String packageCode;

    public static StaffOrderListResponse fromEntity(Order order) {
        if (order == null) {
            return null;
        }

        String wardName = null;
        if (order.getAddress() != null && order.getAddress().getWard() != null) {
            wardName = order.getAddress().getWard().getWardName();
        }

        int itemCount = 0;
        if (order.getItems() != null) {
            itemCount = order.getItems().stream()
                    .mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 0)
                    .sum();
        }

        String pkgCode = null;
        if (order.getDeliveryPackage() != null) {
            pkgCode = order.getDeliveryPackage().getPackageName();
        }

        return StaffOrderListResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .createdAt(order.getCreatedAt())
                .customerName(order.getUser() != null ? order.getUser().getFullName() : order.getReceiverName())
                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .shippingAddress(order.getShippingAddress())
                .wardName(wardName)
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .totalItems(itemCount)
                .totalAmount(order.getTotalAmount())
                .packageCode(pkgCode)
                .build();
    }
}

