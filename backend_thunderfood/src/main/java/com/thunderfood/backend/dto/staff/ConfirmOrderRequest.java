package com.thunderfood.backend.dto.staff;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmOrderRequest {

    @NotBlank(message = "Tên gói hàng không được để trống")
    private String packageName;

    @Builder.Default
    private Boolean isNewPackage = false;
}

