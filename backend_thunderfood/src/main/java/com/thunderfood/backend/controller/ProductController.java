package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.product.ProductDetailResponse;
import com.thunderfood.backend.dto.product.ProductFilterRequest;
import com.thunderfood.backend.dto.product.ProductListItemResponse;
import com.thunderfood.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductListItemResponse>>> getProducts(
            @ModelAttribute ProductFilterRequest filter
    ) {
        if (filter == null) {
            filter = new ProductFilterRequest();
        }
        PageResponse<ProductListItemResponse> response = productService.getProducts(filter);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách sản phẩm thành công", response));
    }

    @GetMapping("/category/{categorySlug}")
    public ResponseEntity<ApiResponse<PageResponse<ProductListItemResponse>>> getProductsByCategorySlug(
            @PathVariable String categorySlug,
            @ModelAttribute ProductFilterRequest filter
    ) {
        if (filter == null) {
            filter = new ProductFilterRequest();
        }
        PageResponse<ProductListItemResponse> response = productService.getProductsByCategorySlug(
                categorySlug,
                filter
        );
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách sản phẩm theo danh mục thành công", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getProductById(@PathVariable Long id) {
        ProductDetailResponse response = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi tiết sản phẩm thành công", response));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getProductBySlug(@PathVariable String slug) {
        ProductDetailResponse response = productService.getProductBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi tiết sản phẩm thành công", response));
    }
}
