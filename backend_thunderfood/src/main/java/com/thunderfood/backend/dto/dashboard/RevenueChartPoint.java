package com.thunderfood.backend.dto.dashboard;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueChartPoint {

    private String label; // "2026-11-10" hoặc "Tháng 11/2026"
    private BigDecimal revenue;
    private long orderCount;
}

