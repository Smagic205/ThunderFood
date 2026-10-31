package com.thunderfood.backend.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SlugUtilsTest {

    @Test
    @DisplayName("toSlug chuyển đổi chuỗi tiếng Việt có dấu thành slug không dấu chuẩn SEO")
    void testToSlugVietnamese() {
        assertEquals("com-ga-xoi-mo", SlugUtils.toSlug("Cơm Gà Xối Mỡ"));
        assertEquals("pho-bo-tai-nam-dam-da", SlugUtils.toSlug("Phở Bò Tái Nạm Đậm Đà"));
        assertEquals("tra-sua-tran-chau-duong-den", SlugUtils.toSlug("Trà Sữa Trân Châu Đường Đen"));
        assertEquals("banh-mi-pate-trung-dac-biet", SlugUtils.toSlug("Bánh Mì Patê Trứng Đặc Biệt"));
    }

    @Test
    @DisplayName("toSlug xử lý ký tự đ và Đ chính xác")
    void testToSlugLetterD() {
        assertEquals("do-an-vat-dem", SlugUtils.toSlug("Đồ Ăn Vặt Đêm"));
        assertEquals("du-du-dong-lanh", SlugUtils.toSlug("Đu Đủ Đông Lạnh"));
    }

    @Test
    @DisplayName("toSlug loại bỏ ký tự đặc biệt và gộp nhiều khoảng trắng hoặc gạch nối")
    void testToSlugSpecialCharacters() {
        assertEquals("combo-ga-ran-120k", SlugUtils.toSlug("Combo Gà Rán @#! 120k!"));
        assertEquals("pizza-hai-san", SlugUtils.toSlug("   Pizza    Hải   Sản   "));
        assertEquals("mon-ngon-so-1", SlugUtils.toSlug("---Món--Ngon---Số--1---"));
    }

    @Test
    @DisplayName("toSlug trả về rỗng khi input là null hoặc chuỗi trắng")
    void testToSlugEmpty() {
        assertEquals("", SlugUtils.toSlug(null));
        assertEquals("", SlugUtils.toSlug(""));
        assertEquals("", SlugUtils.toSlug("   "));
    }
}
