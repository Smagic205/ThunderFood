package com.thunderfood.backend.dto.auth;

import com.thunderfood.backend.dto.address.AddressResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private UserDto user;
    private String message;
    private Boolean requiresVerification;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private Long id;
        private String email;
        private String fullName;
        private String phone;
        private String role;
        private String avatarUrl;
        private String authProvider;
        private String status;
        private AddressResponse defaultAddress;
        private List<AddressResponse> addresses;
    }
}
