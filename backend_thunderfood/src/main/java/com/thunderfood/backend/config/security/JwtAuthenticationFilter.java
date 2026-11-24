package com.thunderfood.backend.config.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");

        // Kiểm tra header Authorization (cho phép cả "Bearer " và "bearer ")
        if (authHeader == null || !authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Lấy token và làm sạch dữ liệu
        String jwt = authHeader.substring(7).trim();

        // Xử lý trường hợp người dùng paste thừa tiền tố "Bearer " trong Postman
        while (jwt.regionMatches(true, 0, "Bearer ", 0, 7)) {
            jwt = jwt.substring(7).trim();
        }

        // Xử lý trường hợp người dùng copy dính dấu nháy kép từ response JSON ("...")
        if (jwt.startsWith("\"") && jwt.endsWith("\"") && jwt.length() >= 2) {
            jwt = jwt.substring(1, jwt.length() - 1).trim();
        }

        try {
            String userEmail = jwtService.extractUsername(jwt);
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    // Kiểm tra tài khoản có bị khóa (LOCKED) hoặc vô hiệu hóa không
                    if (!userDetails.isAccountNonLocked() || !userDetails.isEnabled()) {
                        log.warn("Tài khoản {} đã bị khóa hoặc vô hiệu hóa, từ chối request [{}]", userEmail, request.getRequestURI());
                        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                        response.setCharacterEncoding("UTF-8");
                        response.setStatus(HttpStatus.FORBIDDEN.value());

                        ApiResponse<String> apiResponse = ApiResponse.error("Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ hỗ trợ.");
                        new ObjectMapper().writeValue(response.getOutputStream(), apiResponse);
                        return;
                    }

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    log.warn("Token không hợp lệ hoặc đã hết hạn cho user: {}", userEmail);
                }
            }
        } catch (Exception e) {
            log.warn("Xác thực JWT thất bại cho request [{}]: {}", request.getRequestURI(), e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
