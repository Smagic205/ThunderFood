package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.dashboard.DashboardSummaryResponse;
import com.thunderfood.backend.dto.dashboard.RevenueChartPoint;
import com.thunderfood.backend.dto.dashboard.ShipperPerformanceResponse;
import com.thunderfood.backend.dto.dashboard.TopProductResponse;

import java.time.LocalDate;
import java.util.List;

public interface DashboardService {

    DashboardSummaryResponse getSummary(String period, LocalDate customStart, LocalDate customEnd);

    List<RevenueChartPoint> getRevenueChart(LocalDate startDate, LocalDate endDate);

    List<TopProductResponse> getTopProducts(LocalDate startDate, LocalDate endDate, int limit);

    List<ShipperPerformanceResponse> getShipperPerformance(LocalDate startDate, LocalDate endDate);
}

