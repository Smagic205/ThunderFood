package com.thunderfood.backend.dto.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRequest {

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 150, message = "Tên danh mục không được vượt quá 150 ký tự")
    private String name;

    @NotBlank(message = "Slug không được để trống")
    @Size(max = 150, message = "Slug không được vượt quá 150 ký tự")
    private String slug;

    private String description;

    @Builder.Default
    private Boolean isActive = true;
}
