package com.thunderfood.backend.dto.category;

import com.thunderfood.backend.entity.Category;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryAdminResponse {
    private Integer id;
    private String name;
    private String slug;
    private String description;
    private Boolean isActive;

    public static CategoryAdminResponse fromEntity(Category category) {
        if (category == null) {
            return null;
        }
        return CategoryAdminResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .isActive(category.getIsActive())
                .build();
    }
}
