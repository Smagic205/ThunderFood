package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.category.CategoryResponse;
import com.thunderfood.backend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.product.ProductListItemResponse;
import com.thunderfood.backend.service.ProductService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import com.thunderfood.backend.dto.product.ProductFilterRequest;
import org.springframework.web.bind.annotation.ModelAttribute;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getActiveCategories() {
        List<CategoryResponse> categories = categoryService.getActiveCategories();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách danh mục thành công", categories));
    }

    @GetMapping("/{slug}/products")
    public ResponseEntity<ApiResponse<PageResponse<ProductListItemResponse>>> getProductsByCategorySlug(
            @PathVariable String slug,
            @ModelAttribute ProductFilterRequest filter
    ) {
        if (filter == null) {
            filter = new ProductFilterRequest();
        }
        PageResponse<ProductListItemResponse> response = productService.getProductsByCategorySlug(
                slug,
                filter
        );
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách sản phẩm theo danh mục thành công", response));
    }
}
