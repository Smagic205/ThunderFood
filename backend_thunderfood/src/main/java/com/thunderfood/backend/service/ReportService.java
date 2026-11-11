package com.thunderfood.backend.service;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;

public interface ReportService {

    ByteArrayInputStream exportOrdersToExcel(LocalDate startDate, LocalDate endDate);

    ByteArrayInputStream exportRevenueReportToPdf(LocalDate startDate, LocalDate endDate);
}

