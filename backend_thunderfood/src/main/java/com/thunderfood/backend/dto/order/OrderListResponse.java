package com.thunderfood.backend.dto.order;

import com.thunderfood.backend.entity.Order;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderListResponse {

    private Long id;
    private String orderCode;
    private LocalDateTime createdAt;
    private String status;
    private String paymentMethod;
    private String paymentStatus;
    private Integer totalItems;
    private BigDecimal totalAmount;

    @Builder.Default
    private List<OrderItemResponse> previewItems = new ArrayList<>();

    public static OrderListResponse fromEntity(Order order, List<OrderItemResponse> previewItems) {
        if (order == null) {
            return null;
        }
        int itemCount = order.getItems() != null ? order.getItems().size() : 0;
        return OrderListResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .createdAt(order.getCreatedAt())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .totalItems(itemCount)
                .totalAmount(order.getTotalAmount())
                .previewItems(previewItems != null ? previewItems : new ArrayList<>())
                .build();
    }
}
