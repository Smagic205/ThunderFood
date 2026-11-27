package com.thunderfood.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.config.security.AuthCookieService;
import com.thunderfood.backend.config.security.DynamicCookieCsrfTokenRepository;
import com.thunderfood.backend.config.security.JwtAuthenticationEntryPoint;
import com.thunderfood.backend.config.security.JwtAuthenticationFilter;
import com.thunderfood.backend.config.security.RateLimitingFilter;
import com.thunderfood.backend.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final AuthCookieService authCookieService;
    private final DynamicCookieCsrfTokenRepository csrfTokenRepository;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3008,http://localhost:3009,http://localhost:3010,https://thunderfoods.vercel.app,https://thunderfoods-admin.vercel.app,https://thunderfoods-staff.vercel.app}")
    private String allowedOriginsConfig;

    @Value("${app.rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        CsrfTokenRequestAttributeHandler csrfRequestHandler = new CsrfTokenRequestAttributeHandler();

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfTokenRepository)
                        .csrfTokenRequestHandler(csrfRequestHandler)
                        .requireCsrfProtectionMatcher(csrfProtectionMatcher())
                )
                .headers(headers -> headers
                        .frameOptions(frame -> frame.sameOrigin())
                        .contentTypeOptions(contentType -> {})
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(jsonAccessDeniedHandler())
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/staff/register").hasRole("ADMIN")
                        .requestMatchers(
                                "/api/v1/health",
                                "/api/v1/health/**",
                                "/api/v1/auth/**",
                                "/api/v1/categories/**",
                                "/api/v1/products/**",
                                "/api/v1/addresses/wards/**",
                                "/api/v1/banners/**",
                                "/api/v1/vouchers/**",
                                "/api/v1/reviews/product/**",
                                "/api/v1/payments/sepay/webhook",
                                "/api/v1/payments/sepay/ipn",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        .requestMatchers(
                                "/api/v1/admin/**",
                                "/api/v1/admin/orders/**",
                                "/api/v1/admin/packages/**"
                        ).hasRole("ADMIN")
                        .requestMatchers(
                                "/api/v1/staff/**",
                                "/api/v1/staff/orders/**"
                        ).hasAnyRole("STAFF", "ADMIN")
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(new RateLimitingFilter(rateLimitEnabled), CsrfFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(resolveAllowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                DynamicCookieCsrfTokenRepository.CSRF_HEADER_NAME,
                DynamicCookieCsrfTokenRepository.CSRF_RESPONSE_HEADER_NAME,
                "Idempotency-Key",
                "Accept",
                "Origin",
                "X-Requested-With",
                "Cache-Control"
        ));
        configuration.setExposedHeaders(List.of(
                "Retry-After",
                "X-RateLimit-Limit",
                "X-RateLimit-Remaining",
                DynamicCookieCsrfTokenRepository.CSRF_RESPONSE_HEADER_NAME
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private List<String> resolveAllowedOrigins() {
        Set<String> origins = new LinkedHashSet<>();
        if (allowedOriginsConfig != null && !allowedOriginsConfig.isBlank()) {
            for (String entry : allowedOriginsConfig.split(",")) {
                String normalized = normalizeOrigin(entry);
                if (normalized != null) {
                    origins.add(normalized);
                }
            }
        }
        String normalizedFrontend = normalizeOrigin(frontendUrl);
        if (normalizedFrontend != null) {
            origins.add(normalizedFrontend);
        }
        if (origins.isEmpty()) {
            origins.add("http://localhost:5173");
        }
        return List.copyOf(origins);
    }

    private String normalizeOrigin(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim().replaceAll("/+$", "");
        if (trimmed.isEmpty() || "*".equals(trimmed)) {
            return null;
        }
        return trimmed;
    }

    /**
     * Requires CSRF verification for mutating browser requests using cookies or browser Origin/Fetch
     * metadata, while exempting SePay server-to-server callbacks and stateless Bearer API clients
     * on non-cookie endpoints.
     */
    private RequestMatcher csrfProtectionMatcher() {
        Set<String> safeMethods = Set.of("GET", "HEAD", "TRACE", "OPTIONS");
        return request -> {
            if (request.getMethod() == null || safeMethods.contains(request.getMethod().toUpperCase(Locale.ROOT))) {
                return false;
            }
            String path = normalizePath(request);
            if (path.equals("/api/v1/payments/sepay/webhook")
                    || path.equals("/api/v1/payments/sepay/ipn")) {
                return false;
            }

            boolean isCookieSessionEndpoint = path.equals("/api/v1/auth/refresh-token")
                    || path.equals("/api/v1/auth/logout");
            boolean hasRefreshCookie = authCookieService.hasCookie(request, authCookieService.getCookieName());
            boolean hasXsrfCookie = authCookieService.hasCookie(request, DynamicCookieCsrfTokenRepository.CSRF_COOKIE_NAME);
            boolean hasBrowserMetadata = request.getHeader("Origin") != null
                    || request.getHeader("Sec-Fetch-Site") != null;

            if (isCookieSessionEndpoint) {
                return hasRefreshCookie || hasXsrfCookie || hasBrowserMetadata;
            }

            String authHeader = request.getHeader("Authorization");
            boolean hasBearerToken = authHeader != null && authHeader.regionMatches(true, 0, "Bearer ", 0, 7);
            if (hasBearerToken && !hasRefreshCookie) {
                return false;
            }

            return hasRefreshCookie || hasXsrfCookie || hasBrowserMetadata;
        };
    }

    private String normalizePath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && uri.startsWith(contextPath)) {
            return uri.substring(contextPath.length());
        }
        return uri;
    }

    private AccessDeniedHandler jsonAccessDeniedHandler() {
        ObjectMapper objectMapper = new ObjectMapper();
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());

            boolean isCsrf = accessDeniedException instanceof CsrfException;
            String message = isCsrf
                    ? "Phiên bảo mật CSRF không hợp lệ hoặc đã hết hạn. Vui lòng thử lại."
                    : (accessDeniedException.getMessage() != null && !accessDeniedException.getMessage().isBlank()
                    ? accessDeniedException.getMessage()
                    : "Bạn không có quyền thực hiện thao tác này");
            String code = isCsrf ? "CSRF_INVALID" : null;

            objectMapper.writeValue(response.getOutputStream(), ApiResponse.error(message, code));
        };
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
