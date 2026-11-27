package com.thunderfood.backend.service;

import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.repository.OrderRepository;
import com.thunderfood.backend.service.impl.ReportServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    @Test
    @DisplayName("exportOrdersToExcel và exportRevenueReportToPdf xuất dữ liệu hợp lệ")
    void exportExcelAndPdf_Success() {
        Order o = Order.builder()
                .orderCode("TF001")
                .receiverName("Nguyễn Văn A")
                .totalAmount(new BigDecimal("120000"))
                .status("DELIVERED")
                .createdAt(LocalDateTime.of(2026, 11, 20, 10, 0))
                .build();

        when(orderRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(any(), any())).thenReturn(List.of(o));
        when(orderRepository.calculateTotalRevenue(any(), any())).thenReturn(new BigDecimal("120000"));

        ByteArrayInputStream excel = reportService.exportOrdersToExcel(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 27));
        ByteArrayInputStream pdf = reportService.exportRevenueReportToPdf(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 27));

        assertTrue(excel.readAllBytes().length > 0);
        assertTrue(pdf.readAllBytes().length > 0);
    }
}
