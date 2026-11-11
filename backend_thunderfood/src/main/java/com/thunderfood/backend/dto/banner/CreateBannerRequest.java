package com.thunderfood.backend.dto.banner;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBannerRequest {

    @NotBlank(message = "Đường dẫn ảnh banner không được để trống")
    private String imageUrl;

    private String linkUrl;

    @Builder.Default
    private Integer sortOrder = 0;

    @Builder.Default
    private Boolean isActive = true;
}

