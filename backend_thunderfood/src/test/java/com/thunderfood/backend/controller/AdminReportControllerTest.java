package com.thunderfood.backend.controller;

import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.ReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.ByteArrayInputStream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminReportControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ReportService reportService;

    @InjectMocks
    private AdminReportController adminReportController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminReportController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("Admin xuất báo cáo Excel thành công - 200 OK với content type Excel")
    void exportOrdersExcel_Success() throws Exception {
        byte[] mockBytes = "mock excel content".getBytes();
        when(reportService.exportOrdersToExcel(any(), any()))
                .thenReturn(new ByteArrayInputStream(mockBytes));

        mockMvc.perform(get("/api/v1/admin/reports/export/excel"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=thunderfood_orders_report.xlsx"))
                .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }

    @Test
    @DisplayName("Admin xuất báo cáo PDF thành công - 200 OK với content type PDF")
    void exportRevenuePdf_Success() throws Exception {
        byte[] mockBytes = "mock pdf content".getBytes();
        when(reportService.exportRevenueReportToPdf(any(), any()))
                .thenReturn(new ByteArrayInputStream(mockBytes));

        mockMvc.perform(get("/api/v1/admin/reports/export/pdf"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=thunderfood_revenue_report.pdf"))
                .andExpect(content().contentType("application/pdf"));
    }
}
