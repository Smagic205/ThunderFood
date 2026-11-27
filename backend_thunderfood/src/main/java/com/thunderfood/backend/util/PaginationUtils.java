package com.thunderfood.backend.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Chuẩn hóa tham số phân trang và giới hạn kích thước trang tối đa để tránh OOM / lạm dụng query.
 */
public final class PaginationUtils {

    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE = 50;

    private PaginationUtils() {}

    public static Pageable toPageable(int page, int size) {
        return PageRequest.of(clampPage(page), clampSize(size));
    }

    public static Pageable toPageable(int page, int size, Sort sort) {
        if (sort == null || sort.isUnsorted()) {
            return toPageable(page, size);
        }
        return PageRequest.of(clampPage(page), clampSize(size), sort);
    }

    public static int clampPage(int page) {
        return Math.max(0, page);
    }

    public static int clampSize(int size) {
        if (size <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    public static int clampLimit(int limit) {
        return clampSize(limit);
    }
}
