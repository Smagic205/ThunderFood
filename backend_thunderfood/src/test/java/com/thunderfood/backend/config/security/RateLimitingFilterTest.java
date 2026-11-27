package com.thunderfood.backend.config.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

class RateLimitingFilterTest {

    @Test
    @DisplayName("AUTH_STRICT giới hạn 10 request/phút và trả về 429 kèm Retry-After ở request thứ 11")
    void authStrictLimitReturns429WithRetryAfter() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(true);
        AtomicInteger passedCount = new AtomicInteger(0);
        FilterChain chain = (req, res) -> passedCount.incrementAndGet();

        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/login");
            req.setRemoteAddr("203.0.113.10");
            MockHttpServletResponse res = new MockHttpServletResponse();

            filter.doFilter(req, res, chain);
            assertEquals(200, res.getStatus());
            assertNotNull(res.getHeader("X-RateLimit-Remaining"));
        }

        assertEquals(10, passedCount.get());

        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        blockedReq.setRemoteAddr("203.0.113.10");
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();

        filter.doFilter(blockedReq, blockedRes, chain);

        assertEquals(429, blockedRes.getStatus());
        assertEquals("0", blockedRes.getHeader("X-RateLimit-Remaining"));
        assertNotNull(blockedRes.getHeader("Retry-After"));
        assertTrue(blockedRes.getContentAsString(StandardCharsets.UTF_8).contains("Bạn thao tác xác thực quá nhanh"));
        assertEquals(10, passedCount.get());

        // IP khác vẫn có bucket độc lập
        MockHttpServletRequest otherIpReq = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        otherIpReq.setRemoteAddr("203.0.113.99");
        MockHttpServletResponse otherIpRes = new MockHttpServletResponse();
        filter.doFilter(otherIpReq, otherIpRes, chain);
        assertEquals(HttpServletResponse.SC_OK, otherIpRes.getStatus());
        assertEquals(11, passedCount.get());
    }

    @Test
    @DisplayName("Webhook SePay, Healthcheck và preflight OPTIONS không bị giới hạn rate limit")
    void bypassesWebhooksHealthAndOptions() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(true);
        AtomicInteger passedCount = new AtomicInteger(0);
        FilterChain chain = (req, res) -> passedCount.incrementAndGet();

        String[] exemptedPaths = {
                "/api/v1/payments/sepay/webhook",
                "/api/v1/payments/sepay/ipn",
                "/api/v1/health"
        };

        for (String path : exemptedPaths) {
            for (int i = 0; i < 30; i++) {
                MockHttpServletRequest req = new MockHttpServletRequest("POST", path);
                req.setRemoteAddr("198.51.100.5");
                MockHttpServletResponse res = new MockHttpServletResponse();
                filter.doFilter(req, res, chain);
                assertEquals(200, res.getStatus());
            }
        }

        MockHttpServletRequest optionsReq = new MockHttpServletRequest("OPTIONS", "/api/v1/auth/login");
        optionsReq.setRemoteAddr("198.51.100.5");
        MockHttpServletResponse optionsRes = new MockHttpServletResponse();
        filter.doFilter(optionsReq, optionsRes, chain);
        assertEquals(200, optionsRes.getStatus());
        assertEquals(91, passedCount.get());
    }
}
