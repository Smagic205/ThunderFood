package com.thunderfood.backend.dto.banner;

import com.thunderfood.backend.entity.Banner;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannerResponse {
    private Long id;
    private String imageUrl;
    private String linkUrl;
    private Integer sortOrder;
    private Boolean isActive;

    public static BannerResponse fromEntity(Banner banner) {
        return BannerResponse.builder()
                .id(banner.getId())
                .imageUrl(banner.getImageUrl())
                .linkUrl(banner.getLinkUrl())
                .sortOrder(banner.getSortOrder())
                .isActive(banner.getIsActive())
                .build();
    }
}

