package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.product.ProductAdminResponse;
import com.thunderfood.backend.dto.product.ProductCreateRequest;
import com.thunderfood.backend.dto.product.ProductUpdateRequest;
import com.thunderfood.backend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductAdminResponse>> getProductById(@PathVariable Long id) {
        ProductAdminResponse response = productService.getProductDetailForAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin món ăn thành công", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductAdminResponse>> createProduct(
            @Valid @RequestBody ProductCreateRequest request
    ) {
        ProductAdminResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm mới món ăn thành công", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductAdminResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest request
    ) {
        ProductAdminResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật món ăn thành công", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa mềm món ăn thành công (ngừng kinh doanh và xóa khỏi giỏ hàng)", null));
    }
}
