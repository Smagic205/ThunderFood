package com.thunderfood.backend.config.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.DefaultCsrfToken;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Cookie-backed CSRF token repository that applies dynamic Secure / SameSite attributes
 * and mirrors the token to X-CSRF-TOKEN so cross-origin SPAs can echo X-XSRF-TOKEN.
 */
@Component
@RequiredArgsConstructor
public class DynamicCookieCsrfTokenRepository implements CsrfTokenRepository {

    public static final String CSRF_COOKIE_NAME = "XSRF-TOKEN";
    public static final String CSRF_HEADER_NAME = "X-XSRF-TOKEN";
    public static final String CSRF_RESPONSE_HEADER_NAME = "X-CSRF-TOKEN";
    public static final String CSRF_PARAMETER_NAME = "_csrf";

    private final AuthCookieService authCookieService;

    @Override
    public CsrfToken generateToken(HttpServletRequest request) {
        return new DefaultCsrfToken(CSRF_HEADER_NAME, CSRF_PARAMETER_NAME, UUID.randomUUID().toString());
    }

    @Override
    public void saveToken(CsrfToken token, HttpServletRequest request, HttpServletResponse response) {
        if (token == null) {
            ResponseCookie cleared = authCookieService
                    .baseCookieBuilder(request, CSRF_COOKIE_NAME, "", false, "/")
                    .maxAge(0)
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, cleared.toString());
            return;
        }

        ResponseCookie cookie = authCookieService
                .baseCookieBuilder(request, CSRF_COOKIE_NAME, token.getToken(), false, "/")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        response.setHeader(CSRF_RESPONSE_HEADER_NAME, token.getToken());
    }

    @Override
    public CsrfToken loadToken(HttpServletRequest request) {
        String value = authCookieService.extractCookieValue(request, CSRF_COOKIE_NAME);
        if (value == null) {
            return null;
        }
        return new DefaultCsrfToken(CSRF_HEADER_NAME, CSRF_PARAMETER_NAME, value);
    }
}
