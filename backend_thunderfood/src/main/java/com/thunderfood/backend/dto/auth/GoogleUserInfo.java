package com.thunderfood.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleUserInfo {
    private String sub;
    private String email;
    private String name;
    private String picture;
    private boolean emailVerified;
}
