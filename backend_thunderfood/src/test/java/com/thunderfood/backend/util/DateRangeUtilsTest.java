package com.thunderfood.backend.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

class DateRangeUtilsTest {

    @Test
    @DisplayName("validate ném IllegalArgumentException khi startDate sau endDate")
    void validate_ThrowsWhenStartAfterEnd() {
        LocalDate start = LocalDate.of(2026, 11, 20);
        LocalDate end = LocalDate.of(2026, 11, 10);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> DateRangeUtils.validate(start, end)
        );
        assertTrue(ex.getMessage().contains("không được lớn hơn"));
    }

    @Test
    @DisplayName("toStartOfDay và toEndOfDay chuyển đổi đúng ranh giới ngày")
    void toStartAndEndOfDay() {
        LocalDate date = LocalDate.of(2026, 11, 27);
        assertEquals(LocalDateTime.of(date, LocalTime.MIN), DateRangeUtils.toStartOfDay(date));
        assertEquals(LocalDateTime.of(date, LocalTime.MAX), DateRangeUtils.toEndOfDay(date));
        assertNull(DateRangeUtils.toStartOfDay(null));
        assertNull(DateRangeUtils.toEndOfDay(null));
    }

    @Test
    @DisplayName("isWithinRange kiểm tra đúng khoảng ngày và null")
    void isWithinRange_Cases() {
        LocalDate start = LocalDate.of(2026, 11, 1);
        LocalDate end = LocalDate.of(2026, 11, 30);

        assertTrue(DateRangeUtils.isWithinRange(LocalDateTime.of(2026, 11, 15, 12, 0), start, end));
        assertTrue(DateRangeUtils.isWithinRange(LocalDateTime.of(2026, 11, 15, 12, 0), null, null));
        assertFalse(DateRangeUtils.isWithinRange(null, start, end));
        assertFalse(DateRangeUtils.isWithinRange(LocalDateTime.of(2026, 10, 31, 23, 59), start, end));
        assertFalse(DateRangeUtils.isWithinRange(LocalDateTime.of(2026, 12, 1, 0, 0), start, end));
    }
}
