package com.thunderfood.backend.dto.banner;

import com.thunderfood.backend.validation.SafeUrl;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBannerRequest {

    @NotBlank(message = "Đường dẫn ảnh banner không được để trống")
    @SafeUrl(message = "Đường dẫn ảnh banner không hợp lệ hoặc không an toàn")
    private String imageUrl;

    @SafeUrl(message = "Đường dẫn liên kết không hợp lệ hoặc không an toàn")
    private String linkUrl;

    @Builder.Default
    private Integer sortOrder = 0;

    @Builder.Default
    private Boolean isActive = true;
}

