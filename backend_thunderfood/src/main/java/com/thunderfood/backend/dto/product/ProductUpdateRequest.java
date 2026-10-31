package com.thunderfood.backend.dto.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductUpdateRequest {

    @NotBlank(message = "Tên món ăn không được để trống")
    @Size(max = 200, message = "Tên món ăn không được vượt quá 200 ký tự")
    private String name;

    @Size(max = 200, message = "Slug không được vượt quá 200 ký tự")
    private String slug;

    @NotNull(message = "Danh mục không được để trống")
    private Integer categoryId;

    @NotNull(message = "Giá sản phẩm không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá sản phẩm phải lớn hơn 0")
    private BigDecimal price;

    @DecimalMin(value = "0.0", inclusive = true, message = "Giá khuyến mãi phải lớn hơn hoặc bằng 0")
    private BigDecimal discountPrice;

    @Min(value = 0, message = "Số lượng tồn kho phải lớn hơn hoặc bằng 0")
    private Integer stockQuantity;

    private String description;

    private Boolean isAvailable;

    @Valid
    private List<ProductImageRequest> images;
}
