package com.thunderfood.backend.util;

import com.thunderfood.backend.entity.Order;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ExcelExportHelperTest {

    @Test
    @DisplayName("ordersToExcel chặn Formula Injection với chuỗi bắt đầu bằng =, +, -, @")
    void ordersToExcel_SanitizesFormulaCells() throws Exception {
        Order maliciousOrder = Order.builder()
                .orderCode("=CMD()")
                .createdAt(LocalDateTime.of(2026, 11, 27, 10, 0))
                .receiverName("+HYPERLINK(\"http://evil\")")
                .receiverPhone("-123456")
                .shippingAddress("@SUM(1+1)*cmd|' /C calc'!A0")
                .paymentMethod("COD")
                .paymentStatus("UNPAID")
                .shippingFee(new BigDecimal("15000"))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("115000"))
                .status("PENDING")
                .build();

        ByteArrayInputStream stream = ExcelExportHelper.ordersToExcel(List.of(maliciousOrder));
        try (Workbook workbook = new XSSFWorkbook(stream)) {
            Sheet sheet = workbook.getSheetAt(0);
            Row dataRow = sheet.getRow(1);

            assertEquals("'=CMD()", dataRow.getCell(1).getStringCellValue());
            assertEquals("'+HYPERLINK(\"http://evil\")", dataRow.getCell(3).getStringCellValue());
            assertEquals("'-123456", dataRow.getCell(4).getStringCellValue());
            assertEquals("'@SUM(1+1)*cmd|' /C calc'!A0", dataRow.getCell(5).getStringCellValue());
            assertEquals("COD", dataRow.getCell(6).getStringCellValue());
        }
    }
}
