package com.thunderfood.backend.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public class SlugUtils {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s+]");
    private static final Pattern MULTI_HYPHEN = Pattern.compile("-+");

    private SlugUtils() {
    }

    public static String toSlug(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }

        // Thay thế ký tự đ, Đ đặc thù của tiếng Việt trước khi normalize
        String normalizedInput = input
                .replace("đ", "d")
                .replace("Đ", "d");

        // Tách các dấu thanh tiếng Việt
        String nowhitespace = WHITESPACE.matcher(normalizedInput.trim()).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String slug = pattern.matcher(normalized).replaceAll("");

        // Chuyển sang chữ thường
        slug = slug.toLowerCase(Locale.ENGLISH);

        // Loại bỏ ký tự đặc biệt, chỉ giữ lại chữ, số và dấu gạch nối
        slug = NON_LATIN.matcher(slug).replaceAll("");

        // Gộp nhiều dấu gạch nối liên tiếp thành một dấu
        slug = MULTI_HYPHEN.matcher(slug).replaceAll("-");

        // Xóa dấu gạch nối ở đầu và cuối chuỗi nếu có
        if (slug.startsWith("-")) {
            slug = slug.substring(1);
        }
        if (slug.endsWith("-")) {
            slug = slug.substring(0, slug.length() - 1);
        }

        return slug;
    }
}
