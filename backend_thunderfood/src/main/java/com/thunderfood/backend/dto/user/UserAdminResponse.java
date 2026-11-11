package com.thunderfood.backend.dto.user;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAdminResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String role;
    private String status;
    private String authProvider;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

