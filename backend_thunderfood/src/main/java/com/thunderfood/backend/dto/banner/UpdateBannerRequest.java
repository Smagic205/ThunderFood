package com.thunderfood.backend.dto.banner;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateBannerRequest {

    @NotBlank(message = "Đường dẫn ảnh banner không được để trống")
    private String imageUrl;

    private String linkUrl;

    private Integer sortOrder;

    private Boolean isActive;
}

