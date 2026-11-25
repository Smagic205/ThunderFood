package com.thunderfood.backend.dto.payment;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SepayGatewayIpnRequest {

    private Long timestamp;

    @JsonProperty("notification_type")
    private String notificationType;

    private IpnOrder order;
    private IpnTransaction transaction;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class IpnOrder {
        private String id;

        @JsonProperty("order_id")
        private String orderId;

        @JsonProperty("order_status")
        private String orderStatus;

        @JsonProperty("order_currency")
        private String orderCurrency;

        @JsonProperty("order_amount")
        private BigDecimal orderAmount;

        @JsonProperty("order_invoice_number")
        private String orderInvoiceNumber;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class IpnTransaction {
        private String id;

        @JsonProperty("payment_method")
        private String paymentMethod;

        @JsonProperty("transaction_id")
        private String transactionId;

        @JsonProperty("transaction_type")
        private String transactionType;

        @JsonProperty("transaction_date")
        private String transactionDate;

        @JsonProperty("transaction_status")
        private String transactionStatus;

        @JsonProperty("transaction_amount")
        private BigDecimal transactionAmount;

        @JsonProperty("transaction_currency")
        private String transactionCurrency;
    }
}
