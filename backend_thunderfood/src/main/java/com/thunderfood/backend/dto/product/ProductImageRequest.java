package com.thunderfood.backend.dto.product;

import com.thunderfood.backend.validation.SafeUrl;
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
    @SafeUrl(message = "Đường dẫn ảnh sản phẩm không hợp lệ hoặc không an toàn")
    private String imageUrl;

    @Builder.Default
    private Boolean isThumbnail = false;

    @Builder.Default
    private Integer sortOrder = 0;
}
