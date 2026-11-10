package com.thunderfood.backend.dto.staff;

import com.thunderfood.backend.dto.order.OrderItemResponse;
import com.thunderfood.backend.dto.order.OrderStatusHistoryResponse;
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
public class StaffOrderDetailResponse {

    private Long id;
    private String orderCode;
    private LocalDateTime createdAt;
    private LocalDateTime deliveredAt;
    private String status;
    private String paymentMethod;
    private String paymentStatus;
    private String note;

    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private String wardName;

    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal originalShippingFee;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;

    private Long packageId;
    private String packageCode;

    private VoucherClientResponse productVoucher;
    private VoucherClientResponse shippingVoucher;

    @Builder.Default
    private List<OrderItemResponse> items = new ArrayList<>();

    @Builder.Default
    private List<OrderStatusHistoryResponse> history = new ArrayList<>();

    public static StaffOrderDetailResponse fromEntity(
            Order order,
            List<OrderItemResponse> items,
            List<OrderStatusHistoryResponse> history,
            VoucherClientResponse productVoucher,
            VoucherClientResponse shippingVoucher
    ) {
        if (order == null) {
            return null;
        }

        String wardName = null;
        if (order.getAddress() != null && order.getAddress().getWard() != null) {
            wardName = order.getAddress().getWard().getWardName();
        }

        Long pkgId = null;
        String pkgCode = null;
        if (order.getDeliveryPackage() != null) {
            pkgId = order.getDeliveryPackage().getId();
            pkgCode = order.getDeliveryPackage().getPackageName();
        }

        return StaffOrderDetailResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .createdAt(order.getCreatedAt())
                .deliveredAt(order.getDeliveredAt())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .note(order.getNote())
                .customerId(order.getUser() != null ? order.getUser().getId() : null)
                .customerName(order.getUser() != null ? order.getUser().getFullName() : null)
                .customerEmail(order.getUser() != null ? order.getUser().getEmail() : null)
                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .shippingAddress(order.getShippingAddress())
                .wardName(wardName)
                .subtotalAmount(order.getSubtotalAmount())
                .discountAmount(order.getDiscountAmount())
                .originalShippingFee(order.getOriginalShippingFee())
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .packageId(pkgId)
                .packageCode(pkgCode)
                .productVoucher(productVoucher)
                .shippingVoucher(shippingVoucher)
                .items(items != null ? items : new ArrayList<>())
                .history(history != null ? history : new ArrayList<>())
                .build();
    }
}

