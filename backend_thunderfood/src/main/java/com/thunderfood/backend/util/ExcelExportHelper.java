package com.thunderfood.backend.util;

import com.thunderfood.backend.entity.Order;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

public final class ExcelExportHelper {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private ExcelExportHelper() {}

    public static ByteArrayInputStream ordersToExcel(List<Order> orders) {
        String[] columns = {
                "STT", "Mã đơn hàng", "Ngày đặt", "Người nhận", "SĐT",
                "Địa chỉ giao hàng", "Phương thức", "Trạng thái thanh toán",
                "Phí ship", "Giảm giá", "Tổng thanh toán", "Trạng thái đơn"
        };

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Danh sách đơn hàng");

            // Header Font & Style
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCellStyle.setAlignment(HorizontalAlignment.CENTER);

            // Data Style & Number Formats
            DataFormat format = workbook.createDataFormat();
            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.setDataFormat(format.getFormat("#,##0"));

            // Create Header Row
            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < columns.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(columns[col]);
                cell.setCellStyle(headerCellStyle);
            }

            // Fill Data Rows
            int rowIdx = 1;
            BigDecimal grandTotal = BigDecimal.ZERO;

            for (int i = 0; i < orders.size(); i++) {
                Order order = orders.get(i);
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(i + 1);
                row.createCell(1).setCellValue(order.getOrderCode() != null ? order.getOrderCode() : "");
                row.createCell(2).setCellValue(order.getCreatedAt() != null ? order.getCreatedAt().format(DATE_FORMATTER) : "");
                row.createCell(3).setCellValue(order.getReceiverName() != null ? order.getReceiverName() : "");
                row.createCell(4).setCellValue(order.getReceiverPhone() != null ? order.getReceiverPhone() : "");
                row.createCell(5).setCellValue(order.getShippingAddress() != null ? order.getShippingAddress() : "");
                row.createCell(6).setCellValue(order.getPaymentMethod() != null ? order.getPaymentMethod() : "");
                row.createCell(7).setCellValue(order.getPaymentStatus() != null ? order.getPaymentStatus() : "");

                Cell shipCell = row.createCell(8);
                shipCell.setCellValue(order.getShippingFee() != null ? order.getShippingFee().doubleValue() : 0.0);
                shipCell.setCellStyle(currencyStyle);

                Cell discountCell = row.createCell(9);
                discountCell.setCellValue(order.getDiscountAmount() != null ? order.getDiscountAmount().doubleValue() : 0.0);
                discountCell.setCellStyle(currencyStyle);

                Cell totalCell = row.createCell(10);
                double total = order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0;
                totalCell.setCellValue(total);
                totalCell.setCellStyle(currencyStyle);
                if (order.getTotalAmount() != null && "DELIVERED".equals(order.getStatus())) {
                    grandTotal = grandTotal.add(order.getTotalAmount());
                }

                row.createCell(11).setCellValue(order.getStatus() != null ? order.getStatus() : "");
            }

            // Summary Row
            Row summaryRow = sheet.createRow(rowIdx);
            Cell sumLabel = summaryRow.createCell(9);
            sumLabel.setCellValue("Tổng doanh thu giao thành công:");
            Font sumFont = workbook.createFont();
            sumFont.setBold(true);
            CellStyle sumStyle = workbook.createCellStyle();
            sumStyle.setFont(sumFont);
            sumLabel.setCellStyle(sumStyle);

            Cell sumVal = summaryRow.createCell(10);
            sumVal.setCellValue(grandTotal.doubleValue());
            CellStyle grandTotalStyle = workbook.createCellStyle();
            grandTotalStyle.setFont(sumFont);
            grandTotalStyle.setDataFormat(format.getFormat("#,##0"));
            sumVal.setCellStyle(grandTotalStyle);

            // Auto-size all columns
            for (int col = 0; col < columns.length; col++) {
                sheet.autoSizeColumn(col);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Lỗi tạo file Excel: " + e.getMessage(), e);
        }
    }
}

