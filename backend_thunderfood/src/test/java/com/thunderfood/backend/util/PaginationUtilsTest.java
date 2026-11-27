package com.thunderfood.backend.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import static org.junit.jupiter.api.Assertions.*;

class PaginationUtilsTest {

    @Test
    @DisplayName("toPageable giới hạn page >= 0 và size trong khoảng [1, 50]")
    void toPageable_ClampsNegativeAndExcessiveValues() {
        Pageable negative = PaginationUtils.toPageable(-5, 0);
        assertEquals(0, negative.getPageNumber());
        assertEquals(PaginationUtils.DEFAULT_PAGE_SIZE, negative.getPageSize());

        Pageable huge = PaginationUtils.toPageable(2, 1000000);
        assertEquals(2, huge.getPageNumber());
        assertEquals(PaginationUtils.MAX_PAGE_SIZE, huge.getPageSize());

        Pageable sorted = PaginationUtils.toPageable(1, 200, Sort.by("id").descending());
        assertEquals(50, sorted.getPageSize());
        assertTrue(sorted.getSort().isSorted());
    }

    @Test
    @DisplayName("clampLimit chặn trần limit về tối đa 50")
    void clampLimit_CapsAtMax() {
        assertEquals(10, PaginationUtils.clampLimit(0));
        assertEquals(50, PaginationUtils.clampLimit(999));
        assertEquals(15, PaginationUtils.clampLimit(15));
    }
}
