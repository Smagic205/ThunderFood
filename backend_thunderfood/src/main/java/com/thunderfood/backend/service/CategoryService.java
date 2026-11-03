package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.category.CategoryAdminResponse;
import com.thunderfood.backend.dto.category.CategoryRequest;
import com.thunderfood.backend.dto.category.CategoryResponse;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> getActiveCategories();

    List<CategoryAdminResponse> getAllCategoriesForAdmin();

    CategoryAdminResponse getCategoryById(Integer id);

    CategoryAdminResponse createCategory(CategoryRequest request);

    CategoryAdminResponse updateCategory(Integer id, CategoryRequest request);

    void deleteCategory(Integer id);
}
