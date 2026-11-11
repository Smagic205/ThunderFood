package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.repository.OrderRepository;
import com.thunderfood.backend.service.ReportService;
import com.thunderfood.backend.util.ExcelExportHelper;
import com.thunderfood.backend.util.PdfExportHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

    private final OrderRepository orderRepository;

    @Override
    @Transactional(readOnly = true)
    public ByteArrayInputStream exportOrdersToExcel(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) {
            startDate = LocalDate.now().minusMonths(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<Order> orders = orderRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end);
        log.info("Admin xuất báo cáo Excel đơn hàng từ {} đến {}: tìm thấy {} đơn", startDate, endDate, orders.size());

        return ExcelExportHelper.ordersToExcel(orders);
    }

    @Override
    @Transactional(readOnly = true)
    public ByteArrayInputStream exportRevenueReportToPdf(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) {
            startDate = LocalDate.now().minusMonths(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<Order> orders = orderRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end);
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue(start, end);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String dateRangeText = startDate.format(fmt) + " - " + endDate.format(fmt);

        log.info("Admin xuất báo cáo PDF doanh thu từ {} đến {}: doanh thu {}", startDate, endDate, totalRevenue);

        return PdfExportHelper.revenueReportToPdf(orders, totalRevenue, dateRangeText);
    }
}

