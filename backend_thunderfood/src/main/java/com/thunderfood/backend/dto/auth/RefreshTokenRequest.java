package com.thunderfood.backend.dto.auth;

import lombok.Data;

@Data
public class RefreshTokenRequest {
    private String refreshToken;
    private Boolean rememberMe = Boolean.TRUE;
}
