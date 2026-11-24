package com.thunderfood.backend.dto.product;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProductAvailabilityRequest {

    @NotNull(message = "Trạng thái hiển thị không được để trống")
    private Boolean isAvailable;
}
