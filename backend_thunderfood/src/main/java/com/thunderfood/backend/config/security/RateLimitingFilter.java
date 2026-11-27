package com.thunderfood.backend.config.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.dto.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Token-bucket rate limiting filter per client IP and endpoint sensitivity tier.
 */
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final long STALE_BUCKET_NANOS = TimeUnit.MINUTES.toNanos(5);
    private static final int MAX_BUCKETS_BEFORE_CLEANUP = 5_000;

    private final boolean enabled;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ConcurrentHashMap<String, TokenBucket> buckets = new ConcurrentHashMap<>();
    private final AtomicLong requestCounter = new AtomicLong(0);

    public RateLimitingFilter(boolean enabled) {
        this.enabled = enabled;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        if (!enabled) {
            return true;
        }
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = normalizePath(request);
        if (!path.startsWith("/api/")) {
            return true;
        }
        return path.startsWith("/api/v1/health")
                || path.equals("/api/v1/payments/sepay/webhook")
                || path.equals("/api/v1/payments/sepay/ipn");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        RateLimitTier tier = resolveTier(request.getMethod(), normalizePath(request));
        String clientIp = resolveClientIp(request);
        String bucketKey = tier.name() + ":" + clientIp;

        long nowNanos = System.nanoTime();
        maybeEvictStaleBuckets(nowNanos);

        TokenBucket bucket = buckets.computeIfAbsent(bucketKey, k -> new TokenBucket(tier.capacity, tier.windowNanos, nowNanos));
        ConsumeResult result = bucket.tryConsume(nowNanos);

        response.setHeader("X-RateLimit-Limit", String.valueOf(tier.capacity));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.remaining));

        if (!result.allowed) {
            log.warn("Rate limit exceeded: tier={}, ip={}, method={}, uri={}",
                    tier.name(), clientIp, request.getMethod(), request.getRequestURI());
            response.setHeader("Retry-After", String.valueOf(result.retryAfterSeconds));
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());

            String message = String.format(tier.messageTemplate, result.retryAfterSeconds);
            objectMapper.writeValue(response.getOutputStream(), ApiResponse.error(message));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private RateLimitTier resolveTier(String method, String path) {
        if ("POST".equalsIgnoreCase(method) && (
                path.equals("/api/v1/auth/login")
                        || path.equals("/api/v1/auth/staff/login")
                        || path.equals("/api/v1/auth/register")
                        || path.equals("/api/v1/auth/forgot-password")
                        || path.equals("/api/v1/auth/reset-password")
                        || path.equals("/api/v1/auth/resend-activation")
                        || path.equals("/api/v1/auth/google")
        )) {
            return RateLimitTier.AUTH_STRICT;
        }

        if (path.equals("/api/v1/auth/refresh-token")
                || path.equals("/api/v1/auth/logout")
                || path.equals("/api/v1/auth/verify-email")
                || path.equals("/api/v1/auth/csrf")) {
            return RateLimitTier.AUTH_SESSION;
        }

        if ("POST".equalsIgnoreCase(method) && (
                path.equals("/api/v1/orders/checkout")
                        || path.startsWith("/api/v1/payments/sepay/gateway/checkout")
                        || path.startsWith("/api/v1/payments/sepay/sandbox/simulate")
        )) {
            return RateLimitTier.CHECKOUT_WRITE;
        }

        return RateLimitTier.API_GENERAL;
    }

    private String normalizePath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && uri.startsWith(contextPath)) {
            return uri.substring(contextPath.length());
        }
        return uri;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        return (remoteAddr != null && !remoteAddr.isBlank()) ? remoteAddr.trim() : "unknown";
    }

    private void maybeEvictStaleBuckets(long nowNanos) {
        if ((requestCounter.incrementAndGet() & 0xFF) == 0 && buckets.size() > MAX_BUCKETS_BEFORE_CLEANUP) {
            for (Map.Entry<String, TokenBucket> entry : buckets.entrySet()) {
                if (nowNanos - entry.getValue().lastAccessNanos > STALE_BUCKET_NANOS) {
                    buckets.remove(entry.getKey(), entry.getValue());
                }
            }
        }
    }

    public enum RateLimitTier {
        AUTH_STRICT(10, TimeUnit.MINUTES.toNanos(1), "Bạn thao tác xác thực quá nhanh. Vui lòng thử lại sau %d giây."),
        AUTH_SESSION(30, TimeUnit.MINUTES.toNanos(1), "Quá nhiều yêu cầu phiên đăng nhập. Vui lòng thử lại sau %d giây."),
        CHECKOUT_WRITE(20, TimeUnit.MINUTES.toNanos(1), "Bạn gửi yêu cầu đặt hàng quá nhanh. Vui lòng thử lại sau %d giây."),
        API_GENERAL(120, TimeUnit.MINUTES.toNanos(1), "Bạn thao tác quá nhanh. Vui lòng thử lại sau %d giây.");

        final int capacity;
        final long windowNanos;
        final String messageTemplate;

        RateLimitTier(int capacity, long windowNanos, String messageTemplate) {
            this.capacity = capacity;
            this.windowNanos = windowNanos;
            this.messageTemplate = messageTemplate;
        }
    }

    private static final class TokenBucket {
        private final int capacity;
        private final long windowNanos;
        private double tokens;
        private long lastRefillNanos;
        private volatile long lastAccessNanos;

        private TokenBucket(int capacity, long windowNanos, long nowNanos) {
            this.capacity = capacity;
            this.windowNanos = windowNanos;
            this.tokens = capacity;
            this.lastRefillNanos = nowNanos;
            this.lastAccessNanos = nowNanos;
        }

        private synchronized ConsumeResult tryConsume(long nowNanos) {
            lastAccessNanos = nowNanos;
            if (nowNanos > lastRefillNanos) {
                double elapsedNanos = (double) (nowNanos - lastRefillNanos);
                double added = (elapsedNanos * capacity) / (double) windowNanos;
                tokens = Math.min(capacity, tokens + added);
                lastRefillNanos = nowNanos;
            }

            if (tokens >= 1.0) {
                tokens -= 1.0;
                return new ConsumeResult(true, (long) Math.floor(tokens), 0L);
            }

            double needed = 1.0 - tokens;
            double waitNanos = (needed * (double) windowNanos) / capacity;
            long retryAfterSeconds = Math.max(1L, (long) Math.ceil(waitNanos / 1_000_000_000.0));
            return new ConsumeResult(false, 0L, retryAfterSeconds);
        }
    }

    private record ConsumeResult(boolean allowed, long remaining, long retryAfterSeconds) {
    }
}
