package com.thunderfood.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderStatusRequest {

    @NotBlank(message = "Trạng thái mới không được để trống")
    private String status; // PENDING, CONFIRMED, DELIVERING, DELIVERED, CANCELLED

    private String note;
}
