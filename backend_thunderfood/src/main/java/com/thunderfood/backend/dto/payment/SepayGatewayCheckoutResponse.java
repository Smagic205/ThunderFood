package com.thunderfood.backend.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SepayGatewayCheckoutResponse {
    private Long orderId;
    private String orderCode;
    private BigDecimal amount;
    private String checkoutUrl;
    @Builder.Default
    private Map<String, String> fields = new LinkedHashMap<>();
    private boolean sandboxMode;
}
