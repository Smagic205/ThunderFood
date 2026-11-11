package com.thunderfood.backend.util;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.thunderfood.backend.entity.Order;

import java.awt.Color;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;

public final class PdfExportHelper {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DecimalFormat CURRENCY_FORMATTER = new DecimalFormat("#,##0 VNĐ");

    private PdfExportHelper() {}

    public static ByteArrayInputStream revenueReportToPdf(
            List<Order> orders,
            BigDecimal totalRevenue,
            String dateRangeText
    ) {
        Document document = new Document(PageSize.A4, 30, 30, 40, 40);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 11, Color.GRAY);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.BLACK);
            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);

            // Title
            Paragraph title = new Paragraph("THUNDERFOOD RESTAURANT", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph reportTitle = new Paragraph("BAO CAO DOANH THU & VAN HANH", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(20, 80, 160)));
            reportTitle.setAlignment(Element.ALIGN_CENTER);
            reportTitle.setSpacingBefore(5);
            document.add(reportTitle);

            Paragraph period = new Paragraph("Ky bao cao: " + dateRangeText, subtitleFont);
            period.setAlignment(Element.ALIGN_CENTER);
            period.setSpacingAfter(15);
            document.add(period);

            // Summary Box
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingAfter(15);

            PdfPCell c1 = new PdfPCell(new Phrase("Tong so don hang trong ky: " + orders.size(), boldFont));
            c1.setPadding(8);
            c1.setBackgroundColor(new Color(245, 245, 245));
            summaryTable.addCell(c1);

            PdfPCell c2 = new PdfPCell(new Phrase("Tong doanh thu hoan tat: " + CURRENCY_FORMATTER.format(totalRevenue != null ? totalRevenue : BigDecimal.ZERO), boldFont));
            c2.setPadding(8);
            c2.setBackgroundColor(new Color(230, 245, 230));
            summaryTable.addCell(c2);

            document.add(summaryTable);

            // Detail Table
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.2f, 3.0f, 2.8f, 2.5f, 2.5f, 2.0f});

            String[] headers = {"STT", "Ma don", "Khach hang", "Ngay dat", "Tong tien", "Trang thai"};
            for (String h : headers) {
                PdfPCell header = new PdfPCell(new Phrase(h, headerFont));
                header.setBackgroundColor(new Color(30, 60, 110));
                header.setPadding(6);
                header.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(header);
            }

            int index = 1;
            for (Order o : orders) {
                PdfPCell sttCell = new PdfPCell(new Phrase(String.valueOf(index++), cellFont));
                sttCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(sttCell);

                table.addCell(new PdfPCell(new Phrase(o.getOrderCode(), cellFont)));
                table.addCell(new PdfPCell(new Phrase(o.getReceiverName() != null ? o.getReceiverName() : "", cellFont)));

                String dateStr = o.getCreatedAt() != null ? o.getCreatedAt().format(DATE_FORMATTER) : "";
                table.addCell(new PdfPCell(new Phrase(dateStr, cellFont)));

                String moneyStr = o.getTotalAmount() != null ? CURRENCY_FORMATTER.format(o.getTotalAmount()) : "0";
                PdfPCell moneyCell = new PdfPCell(new Phrase(moneyStr, cellFont));
                moneyCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(moneyCell);

                PdfPCell statusCell = new PdfPCell(new Phrase(o.getStatus(), cellFont));
                statusCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(statusCell);
            }

            document.add(table);

            document.close();
            return new ByteArrayInputStream(out.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Loi tao file PDF bao cao: " + e.getMessage(), e);
        }
    }
}

