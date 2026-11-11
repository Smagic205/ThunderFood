package com.thunderfood.backend.dto.address;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateShippingFeeRequest {

    @NotNull(message = "Phí ship không được để trống")
    @DecimalMin(value = "0.0", message = "Phí ship không được âm")
    private BigDecimal shippingFee;
}

