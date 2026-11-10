package com.thunderfood.backend.dto.staff;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FailDeliveryRequest {

    @NotBlank(message = "Vui lòng nhập lý do giao hàng thất bại")
    private String reason;
}

