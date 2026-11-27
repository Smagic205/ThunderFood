package com.thunderfood.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
    @Pattern(
            regexp = "^(?i)(PENDING|CONFIRMED|DELIVERING|DELIVERED|CANCELLED)$",
            message = "Trạng thái đơn hàng không hợp lệ. Chỉ chấp nhận: PENDING, CONFIRMED, DELIVERING, DELIVERED, CANCELLED"
    )
    private String status; // PENDING, CONFIRMED, DELIVERING, DELIVERED, CANCELLED

    private String note;
}
