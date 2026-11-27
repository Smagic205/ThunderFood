package com.thunderfood.backend.util;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.thunderfood.backend.entity.Order;

import java.awt.Color;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;

public final class PdfExportHelper {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DecimalFormat CURRENCY_FORMATTER = new DecimalFormat("#,##0 VNĐ");
    private static final String REGULAR_FONT_PATH = "/fonts/DejaVuSans.ttf";
    private static final String BOLD_FONT_PATH = "/fonts/DejaVuSans-Bold.ttf";

    private PdfExportHelper() {}

    public static ByteArrayInputStream revenueReportToPdf(
            List<Order> orders,
            BigDecimal totalRevenue,
            String dateRangeText
    ) {
        List<Order> safeOrders = orders != null ? orders : List.of();
        Document document = new Document(PageSize.A4, 30, 30, 40, 40);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Nạp Unicode font hỗ trợ đầy đủ tiếng Việt có dấu
            BaseFont regularBase = loadUnicodeBaseFont(REGULAR_FONT_PATH, BaseFont.HELVETICA);
            BaseFont boldBase = loadUnicodeBaseFont(BOLD_FONT_PATH, BaseFont.HELVETICA_BOLD);

            Font titleFont = new Font(boldBase, 18, Font.NORMAL, Color.DARK_GRAY);
            Font reportTitleFont = new Font(boldBase, 14, Font.NORMAL, new Color(20, 80, 160));
            Font subtitleFont = new Font(regularBase, 11, Font.NORMAL, Color.GRAY);
            Font boldFont = new Font(boldBase, 11, Font.NORMAL, Color.BLACK);
            Font cellFont = new Font(regularBase, 10, Font.NORMAL, Color.BLACK);
            Font headerFont = new Font(boldBase, 10, Font.NORMAL, Color.WHITE);

            // Title
            Paragraph title = new Paragraph("THUNDERFOOD RESTAURANT", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph reportTitle = new Paragraph("BÁO CÁO DOANH THU & VẬN HÀNH", reportTitleFont);
            reportTitle.setAlignment(Element.ALIGN_CENTER);
            reportTitle.setSpacingBefore(5);
            document.add(reportTitle);

            String safeRange = dateRangeText != null ? dateRangeText : "";
            Paragraph period = new Paragraph("Kỳ báo cáo: " + safeRange, subtitleFont);
            period.setAlignment(Element.ALIGN_CENTER);
            period.setSpacingAfter(15);
            document.add(period);

            // Summary Box
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingAfter(15);

            PdfPCell c1 = new PdfPCell(new Phrase("Tổng số đơn hàng trong kỳ: " + safeOrders.size(), boldFont));
            c1.setPadding(8);
            c1.setBackgroundColor(new Color(245, 245, 245));
            summaryTable.addCell(c1);

            PdfPCell c2 = new PdfPCell(new Phrase("Tổng doanh thu hoàn tất: " + CURRENCY_FORMATTER.format(totalRevenue != null ? totalRevenue : BigDecimal.ZERO), boldFont));
            c2.setPadding(8);
            c2.setBackgroundColor(new Color(230, 245, 230));
            summaryTable.addCell(c2);

            document.add(summaryTable);

            // Detail Table
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.2f, 3.0f, 2.8f, 2.5f, 2.5f, 2.0f});

            String[] headers = {"STT", "Mã đơn", "Khách hàng", "Ngày đặt", "Tổng tiền", "Trạng thái"};
            for (String h : headers) {
                PdfPCell header = new PdfPCell(new Phrase(h, headerFont));
                header.setBackgroundColor(new Color(30, 60, 110));
                header.setPadding(6);
                header.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(header);
            }

            int index = 1;
            for (Order o : safeOrders) {
                PdfPCell sttCell = new PdfPCell(new Phrase(String.valueOf(index++), cellFont));
                sttCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(sttCell);

                table.addCell(new PdfPCell(new Phrase(o.getOrderCode() != null ? o.getOrderCode() : "", cellFont)));
                table.addCell(new PdfPCell(new Phrase(o.getReceiverName() != null ? o.getReceiverName() : "", cellFont)));

                String dateStr = o.getCreatedAt() != null ? o.getCreatedAt().format(DATE_FORMATTER) : "";
                table.addCell(new PdfPCell(new Phrase(dateStr, cellFont)));

                String moneyStr = o.getTotalAmount() != null ? CURRENCY_FORMATTER.format(o.getTotalAmount()) : "0 VNĐ";
                PdfPCell moneyCell = new PdfPCell(new Phrase(moneyStr, cellFont));
                moneyCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(moneyCell);

                PdfPCell statusCell = new PdfPCell(new Phrase(o.getStatus() != null ? o.getStatus() : "", cellFont));
                statusCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(statusCell);
            }

            document.add(table);
            document.close();
            return new ByteArrayInputStream(out.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo file PDF báo cáo: " + e.getMessage(), e);
        } finally {
            if (document.isOpen()) {
                document.close();
            }
        }
    }

    private static BaseFont loadUnicodeBaseFont(String resourcePath, String fallbackFontName) throws DocumentException, IOException {
        try (InputStream is = PdfExportHelper.class.getResourceAsStream(resourcePath)) {
            if (is != null) {
                byte[] fontBytes = is.readAllBytes();
                String fontAlias = resourcePath.substring(resourcePath.lastIndexOf('/') + 1);
                return BaseFont.createFont(fontAlias, BaseFont.IDENTITY_H, BaseFont.EMBEDDED, BaseFont.CACHED, fontBytes, null);
            }
        }
        return BaseFont.createFont(fallbackFontName, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
    }
}
