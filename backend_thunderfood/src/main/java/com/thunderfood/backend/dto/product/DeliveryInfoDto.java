package com.thunderfood.backend.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryInfoDto {
    private Integer estimateMinutes;
    private BigDecimal freeShipThreshold;
}
