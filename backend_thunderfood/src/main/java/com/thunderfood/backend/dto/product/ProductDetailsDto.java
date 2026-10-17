package com.thunderfood.backend.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailsDto {
    private String prepTime;
    private String consumeWithin;
    private String kitchenAddress;
    private String allergens;
}
