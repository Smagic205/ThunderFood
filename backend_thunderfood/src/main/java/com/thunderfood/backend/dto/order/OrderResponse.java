package com.thunderfood.backend.dto.order;

import com.thunderfood.backend.dto.voucher.VoucherClientResponse;
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
public class OrderResponse {

    private Long id;
    private String orderCode;
    private LocalDateTime createdAt;
    private LocalDateTime deliveredAt;
    private String status;
    private String paymentMethod;
    private String paymentStatus;
    private String note;

    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;

    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal originalShippingFee;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;

    private VoucherClientResponse productVoucher;
    private VoucherClientResponse shippingVoucher;

    @Builder.Default
    private List<OrderItemResponse> items = new ArrayList<>();

    public static OrderResponse fromEntity(
            Order order,
            List<OrderItemResponse> itemResponses,
            VoucherClientResponse productVoucher,
            VoucherClientResponse shippingVoucher
    ) {
        if (order == null) {
            return null;
        }
        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .createdAt(order.getCreatedAt())
                .deliveredAt(order.getDeliveredAt())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .note(order.getNote())
                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .shippingAddress(order.getShippingAddress())
                .subtotalAmount(order.getSubtotalAmount())
                .discountAmount(order.getDiscountAmount())
                .originalShippingFee(order.getOriginalShippingFee())
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .productVoucher(productVoucher)
                .shippingVoucher(shippingVoucher)
                .items(itemResponses != null ? itemResponses : new ArrayList<>())
                .build();
    }
}
