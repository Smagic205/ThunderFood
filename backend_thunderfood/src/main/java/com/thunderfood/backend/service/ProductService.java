package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.product.*;

public interface ProductService {

    PageResponse<ProductListItemResponse> getProducts(ProductFilterRequest filter);

    PageResponse<ProductListItemResponse> getProducts(
            int page,
            int size,
            Integer categoryId,
            String categorySlug,
            String keyword,
            String sort
    );

    ProductDetailResponse getProductById(Long id);

    ProductDetailResponse getProductBySlug(String slug);

    PageResponse<ProductListItemResponse> getProductsByCategorySlug(
            String categorySlug,
            ProductFilterRequest filter
    );

    PageResponse<ProductListItemResponse> getProductsByCategorySlug(
            String categorySlug,
            int page,
            int size,
            String keyword,
            String sort
    );

    ProductAdminResponse getProductDetailForAdmin(Long id);

    ProductAdminResponse createProduct(ProductCreateRequest request);

    ProductAdminResponse updateProduct(Long id, ProductUpdateRequest request);

    void deleteProduct(Long id);
}
