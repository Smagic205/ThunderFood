package com.thunderfood.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRoleRequest {

    @NotBlank(message = "Vai trò không được để trống")
    @Pattern(regexp = "^(CUSTOMER|STAFF|ADMIN)$", message = "Vai trò chỉ có thể là CUSTOMER, STAFF hoặc ADMIN")
    private String role;
}

