package com.thunderfood.backend.dto.banner;

import com.thunderfood.backend.entity.Banner;
import lombok.*;

import java.time.LocalDateTime;

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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BannerResponse fromEntity(Banner banner) {
        if (banner == null) {
            return null;
        }
        return BannerResponse.builder()
                .id(banner.getId())
                .imageUrl(banner.getImageUrl())
                .linkUrl(banner.getLinkUrl())
                .sortOrder(banner.getSortOrder())
                .isActive(banner.getIsActive())
                .createdAt(banner.getCreatedAt())
                .updatedAt(banner.getUpdatedAt())
                .build();
    }
}
