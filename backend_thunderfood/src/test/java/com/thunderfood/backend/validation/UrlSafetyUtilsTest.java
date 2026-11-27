package com.thunderfood.backend.validation;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UrlSafetyUtilsTest {

    @Test
    @DisplayName("Chấp nhận URL http/https hợp lệ và đường dẫn tương đối an toàn")
    void acceptsSafeHttpHttpsAndRelativeUrls() {
        assertTrue(UrlSafetyUtils.isSafeUrl("https://res.cloudinary.com/demo/image/upload/banner.jpg", true));
        assertTrue(UrlSafetyUtils.isSafeUrl("http://localhost:5173/products", true));
        assertTrue(UrlSafetyUtils.isSafeUrl("/products?category=tra-sua", true));
        assertTrue(UrlSafetyUtils.isSafeUrl("#promo", true));
        assertTrue(UrlSafetyUtils.isSafeUrl(null, true));
        assertTrue(UrlSafetyUtils.isSafeUrl("   ", true));
    }

    @Test
    @DisplayName("Từ chối các scheme độc hại hoặc protocol-relative XSS")
    void rejectsDangerousSchemesAndProtocolRelativeUrls() {
        assertFalse(UrlSafetyUtils.isSafeUrl("javascript:alert(1)", true));
        assertFalse(UrlSafetyUtils.isSafeUrl("JaVaScRiPt:alert(document.cookie)", true));
        assertFalse(UrlSafetyUtils.isSafeUrl("vbscript:msgbox('xss')", true));
        assertFalse(UrlSafetyUtils.isSafeUrl("data:text/html,<script>alert(1)</script>", true));
        assertFalse(UrlSafetyUtils.isSafeUrl("//evil.example.com/phish", true));
        assertFalse(UrlSafetyUtils.isSafeUrl("https://evil.com\njavascript:alert(1)", true));
        assertFalse(UrlSafetyUtils.isSafeUrl("/relative-path", false));
    }
}
