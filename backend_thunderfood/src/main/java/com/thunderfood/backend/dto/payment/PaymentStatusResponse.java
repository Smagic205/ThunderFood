package com.thunderfood.backend.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatusResponse {
    private Long orderId;
    private String orderCode;
    private String paymentMethod;
    private String paymentStatus;
    private String orderStatus;
    private BigDecimal amount;
    private String transactionCode;
    private LocalDateTime paidAt;
}
