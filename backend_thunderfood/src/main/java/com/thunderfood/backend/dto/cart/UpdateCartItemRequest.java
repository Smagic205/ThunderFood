package com.thunderfood.backend.dto.cart;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCartItemRequest {

    @NotNull(message = "Số lượng món không được để trống")
    @Min(value = 1, message = "Số lượng món tối thiểu phải là 1. Nếu muốn xóa món ăn, vui lòng sử dụng chức năng xóa.")
    @Max(value = 99, message = "Số lượng món tối đa là 99")
    private Integer quantity;
}
