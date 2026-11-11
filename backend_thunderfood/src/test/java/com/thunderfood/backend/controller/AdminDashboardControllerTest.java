package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.dashboard.DashboardSummaryResponse;
import com.thunderfood.backend.dto.dashboard.RevenueChartPoint;
import com.thunderfood.backend.dto.dashboard.ShipperPerformanceResponse;
import com.thunderfood.backend.dto.dashboard.TopProductResponse;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminDashboardControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DashboardService dashboardService;

    @InjectMocks
    private AdminDashboardController adminDashboardController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminDashboardController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("Admin lấy summary tổng quan thành công - 200 OK")
    void getSummary_Success() throws Exception {
        DashboardSummaryResponse response = DashboardSummaryResponse.builder()
                .totalRevenue(BigDecimal.valueOf(150000000))
                .previousRevenue(BigDecimal.valueOf(120000000))
                .revenueGrowthRate(25.0)
                .totalOrders(1000)
                .deliveredOrders(850)
                .cancelledOrders(50)
                .build();

        when(dashboardService.getSummary(any(), any(), any())).thenReturn(response);

        mockMvc.perform(get("/api/v1/admin/dashboard/summary")
                        .param("period", "THIS_MONTH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.revenueGrowthRate", is(25.0)))
                .andExpect(jsonPath("$.data.totalOrders", is(1000)));
    }

    @Test
    @DisplayName("Admin lấy dữ liệu biểu đồ doanh thu thành công - 200 OK")
    void getRevenueChart_Success() throws Exception {
        RevenueChartPoint p1 = RevenueChartPoint.builder()
                .label("2026-11-10")
                .revenue(BigDecimal.valueOf(5000000))
                .orderCount(20)
                .build();

        when(dashboardService.getRevenueChart(any(), any())).thenReturn(List.of(p1));

        mockMvc.perform(get("/api/v1/admin/dashboard/revenue-chart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].label", is("2026-11-10")));
    }

    @Test
    @DisplayName("Admin lấy danh sách món bán chạy thành công - 200 OK")
    void getTopProducts_Success() throws Exception {
        TopProductResponse p1 = TopProductResponse.builder()
                .productId(10L)
                .productName("Burger Bò Phô Mai")
                .categoryName("Burger")
                .soldQuantity(250L)
                .totalRevenue(BigDecimal.valueOf(15000000))
                .build();

        when(dashboardService.getTopProducts(any(), any(), any(Integer.class))).thenReturn(List.of(p1));

        mockMvc.perform(get("/api/v1/admin/dashboard/top-products")
                        .param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].productName", is("Burger Bò Phô Mai")));
    }

    @Test
    @DisplayName("Admin lấy thống kê hiệu suất shipper thành công - 200 OK")
    void getShipperPerformance_Success() throws Exception {
        ShipperPerformanceResponse s1 = ShipperPerformanceResponse.builder()
                .staffId(5L)
                .staffName("Shipper Hùng")
                .totalPackages(30)
                .totalOrders(180)
                .deliveredOrders(175)
                .successRate(97.2)
                .build();

        when(dashboardService.getShipperPerformance(any(), any())).thenReturn(List.of(s1));

        mockMvc.perform(get("/api/v1/admin/dashboard/shipper-performance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].staffName", is("Shipper Hùng")));
    }
}
