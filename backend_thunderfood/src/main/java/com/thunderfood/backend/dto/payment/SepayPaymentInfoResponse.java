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
public class SepayPaymentInfoResponse {
    private Long orderId;
    private String orderCode;
    private BigDecimal amount;
    private String bankCode;
    private String accountNumber;
    private String accountName;
    private String transferContent;
    private String qrImageUrl;
    private String paymentStatus;
    private String orderStatus;
    private boolean sandboxMode;
    private String transactionCode;
    private LocalDateTime paidAt;
}
