package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.dashboard.DashboardSummaryResponse;
import com.thunderfood.backend.dto.dashboard.RevenueChartPoint;
import com.thunderfood.backend.dto.dashboard.ShipperPerformanceResponse;
import com.thunderfood.backend.dto.dashboard.TopProductResponse;
import com.thunderfood.backend.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Dashboard Controller", description = "Thống kê & Báo cáo: Doanh thu, Đơn hàng, Món bán chạy, Hiệu suất giao hàng")
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @Operation(summary = "Lấy dữ liệu tổng quan thống kê (Doanh thu, Tăng trưởng, Số đơn theo trạng thái, Khách hàng mới)")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        DashboardSummaryResponse response = dashboardService.getSummary(period, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu tổng quan thành công", response));
    }

    @GetMapping("/revenue-chart")
    @Operation(summary = "Lấy dữ liệu biểu đồ doanh thu theo từng ngày")
    public ResponseEntity<ApiResponse<List<RevenueChartPoint>>> getRevenueChart(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        List<RevenueChartPoint> response = dashboardService.getRevenueChart(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu biểu đồ doanh thu thành công", response));
    }

    @GetMapping("/top-products")
    @Operation(summary = "Lấy danh sách Top món bán chạy nhất theo số lượng và doanh thu")
    public ResponseEntity<ApiResponse<List<TopProductResponse>>> getTopProducts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "10") int limit
    ) {
        List<TopProductResponse> response = dashboardService.getTopProducts(startDate, endDate, limit);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách món bán chạy thành công", response));
    }

    @GetMapping("/shipper-performance")
    @Operation(summary = "Thống kê hiệu suất giao hàng của từng nhân viên/shipper")
    public ResponseEntity<ApiResponse<List<ShipperPerformanceResponse>>> getShipperPerformance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        List<ShipperPerformanceResponse> response = dashboardService.getShipperPerformance(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Lấy thống kê hiệu suất shipper thành công", response));
    }
}

