package com.thunderfood.backend.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Tiện ích kiểm tra và lọc khoảng thời gian (LocalDate -> LocalDateTime).
 */
public final class DateRangeUtils {

    private DateRangeUtils() {}

    public static void validate(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Ngày bắt đầu không được lớn hơn ngày kết thúc");
        }
    }

    public static LocalDateTime toStartOfDay(LocalDate startDate) {
        return startDate != null ? startDate.atStartOfDay() : null;
    }

    public static LocalDateTime toEndOfDay(LocalDate endDate) {
        return endDate != null ? endDate.atTime(LocalTime.MAX) : null;
    }

    public static boolean isWithinRange(LocalDateTime createdAt, LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return true;
        }
        if (createdAt == null) {
            return false;
        }
        if (startDate != null && createdAt.isBefore(startDate.atStartOfDay())) {
            return false;
        }
        if (endDate != null && createdAt.isAfter(endDate.atTime(LocalTime.MAX))) {
            return false;
        }
        return true;
    }
}
