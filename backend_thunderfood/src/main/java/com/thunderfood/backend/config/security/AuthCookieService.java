package com.thunderfood.backend.config.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Manages HttpOnly refresh-token cookies and consistent SameSite/Secure policies
 * across local HTTP development and cross-origin HTTPS production deployments.
 */
@Service
@Getter
public class AuthCookieService {

    public static final String REFRESH_COOKIE_PATH = "/api/v1/auth";

    @Value("${jwt.refresh-token.expiration:604800000}")
    private long refreshExpirationMs = 604800000L;

    @Value("${app.auth.cookie-name:tf_refresh_token}")
    private String cookieName = "tf_refresh_token";

    @Value("${app.auth.cookie-secure:auto}")
    private String cookieSecureMode = "auto";

    @Value("${app.auth.cookie-same-site:auto}")
    private String cookieSameSiteMode = "auto";

    @Value("${app.auth.cookie-domain:}")
    private String cookieDomain = "";

    @Value("${app.auth.expose-refresh-token-in-body:false}")
    private boolean exposeRefreshTokenInBody = false;

    public boolean resolveSecure(HttpServletRequest request) {
        if ("true".equalsIgnoreCase(cookieSecureMode)) {
            return true;
        }
        if ("false".equalsIgnoreCase(cookieSecureMode)) {
            return false;
        }
        if (request == null) {
            return false;
        }
        if (request.isSecure()) {
            return true;
        }
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        return forwardedProto != null && "https".equalsIgnoreCase(forwardedProto.trim());
    }

    public String resolveSameSite(boolean secure) {
        if (cookieSameSiteMode != null && !cookieSameSiteMode.isBlank()
                && !"auto".equalsIgnoreCase(cookieSameSiteMode.trim())) {
            String normalized = cookieSameSiteMode.trim();
            if ("none".equalsIgnoreCase(normalized)) {
                return secure ? "None" : "Lax";
            }
            if ("strict".equalsIgnoreCase(normalized)) {
                return "Strict";
            }
            if ("lax".equalsIgnoreCase(normalized)) {
                return "Lax";
            }
        }
        return secure ? "None" : "Lax";
    }

    public void addRefreshTokenCookie(
            HttpServletRequest request,
            HttpServletResponse response,
            String refreshToken,
            boolean persistent
    ) {
        if (response == null || refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        ResponseCookie.ResponseCookieBuilder builder = baseCookieBuilder(request, cookieName, refreshToken, true, REFRESH_COOKIE_PATH);
        if (persistent && refreshExpirationMs > 0) {
            builder.maxAge(Duration.ofMillis(refreshExpirationMs));
        }
        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    public void clearRefreshTokenCookie(HttpServletRequest request, HttpServletResponse response) {
        if (response == null) {
            return;
        }
        ResponseCookie.ResponseCookieBuilder builder = baseCookieBuilder(request, cookieName, "", true, REFRESH_COOKIE_PATH)
                .maxAge(0);
        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    public ResponseCookie.ResponseCookieBuilder baseCookieBuilder(
            HttpServletRequest request,
            String name,
            String value,
            boolean httpOnly,
            String path
    ) {
        boolean secure = resolveSecure(request);
        String sameSite = resolveSameSite(secure);
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value == null ? "" : value)
                .httpOnly(httpOnly)
                .secure(secure)
                .path(path)
                .sameSite(sameSite);

        if (cookieDomain != null && !cookieDomain.isBlank()) {
            builder.domain(cookieDomain.trim());
        }
        return builder;
    }

    public String extractRefreshTokenFromCookie(HttpServletRequest request) {
        return extractCookieValue(request, cookieName);
    }

    public boolean hasCookie(HttpServletRequest request, String name) {
        return extractCookieValue(request, name) != null;
    }

    public String extractCookieValue(HttpServletRequest request, String name) {
        if (request == null || name == null || request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                return cookie.getValue().trim();
            }
        }
        return null;
    }
}
