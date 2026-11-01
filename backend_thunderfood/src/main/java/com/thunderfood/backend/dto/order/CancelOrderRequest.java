package com.thunderfood.backend.dto.order;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelOrderRequest {

    @NotBlank(message = "Vui lòng nhập lý do hủy đơn hàng")
    private String reason;
}
