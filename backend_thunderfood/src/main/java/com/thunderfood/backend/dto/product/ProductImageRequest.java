package com.thunderfood.backend.dto.product;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageRequest {

    @NotBlank(message = "Đường dẫn ảnh không được để trống")
    private String imageUrl;

    @Builder.Default
    private Boolean isThumbnail = false;

    @Builder.Default
    private Integer sortOrder = 0;
}
