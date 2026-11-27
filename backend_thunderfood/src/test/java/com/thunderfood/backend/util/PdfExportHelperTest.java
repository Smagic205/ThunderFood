package com.thunderfood.backend.util;

import com.thunderfood.backend.entity.Order;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PdfExportHelperTest {

    @Test
    @DisplayName("revenueReportToPdf xuất file PDF hợp lệ với tên khách tiếng Việt có dấu và trường null an toàn")
    void revenueReportToPdf_HandlesVietnameseAndNullFields() {
        Order vietnameseOrder = Order.builder()
                .orderCode("TF2611270001")
                .receiverName("Nguyễn Đặng Quỳnh Anh")
                .createdAt(LocalDateTime.of(2026, 11, 27, 12, 30))
                .totalAmount(new BigDecimal("250000"))
                .status("DELIVERED")
                .build();

        Order nullFieldsOrder = Order.builder()
                .orderCode(null)
                .receiverName(null)
                .createdAt(null)
                .totalAmount(null)
                .status(null)
                .build();

        ByteArrayInputStream pdfStream = PdfExportHelper.revenueReportToPdf(
                List.of(vietnameseOrder, nullFieldsOrder),
                new BigDecimal("250000"),
                "01/11/2026 - 27/11/2026"
        );

        byte[] bytes = pdfStream.readAllBytes();
        assertTrue(bytes.length > 100);
        String header = new String(bytes, 0, 5, StandardCharsets.US_ASCII);
        assertEquals("%PDF-", header);
    }
}
