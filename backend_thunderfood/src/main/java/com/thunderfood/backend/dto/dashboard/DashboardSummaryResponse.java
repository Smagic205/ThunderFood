package com.thunderfood.backend.dto.dashboard;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryResponse {

    private BigDecimal totalRevenue;
    private BigDecimal previousRevenue;
    private Double revenueGrowthRate; // % tăng trưởng so với kỳ trước

    private long totalOrders;
    private long pendingOrders;
    private long confirmedOrders;
    private long deliveringOrders;
    private long deliveredOrders;
    private long cancelledOrders;

    private long newCustomersCount;
}

