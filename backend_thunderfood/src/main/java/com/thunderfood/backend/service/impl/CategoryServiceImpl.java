package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.dto.category.CategoryAdminResponse;
import com.thunderfood.backend.dto.category.CategoryRequest;
import com.thunderfood.backend.dto.category.CategoryResponse;
import com.thunderfood.backend.entity.Category;
import com.thunderfood.backend.repository.CategoryRepository;
import com.thunderfood.backend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getActiveCategories() {
        return categoryRepository.findByIsActiveTrueOrderByIdAsc()
                .stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryAdminResponse> getAllCategoriesForAdmin() {
        return categoryRepository.findAllByOrderByIdAsc()
                .stream()
                .map(CategoryAdminResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryAdminResponse getCategoryById(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + id));
        return CategoryAdminResponse.fromEntity(category);
    }

    @Override
    @Transactional
    public CategoryAdminResponse createCategory(CategoryRequest request) {
        String slug = request.getSlug().trim();
        if (categoryRepository.existsBySlug(slug)) {
            throw new RuntimeException("Slug '" + slug + "' đã tồn tại, vui lòng chọn slug khác");
        }

        Category category = Category.builder()
                .name(request.getName().trim())
                .slug(slug)
                .description(request.getDescription())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        Category saved = categoryRepository.save(category);
        return CategoryAdminResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public CategoryAdminResponse updateCategory(Integer id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + id));

        String slug = request.getSlug().trim();
        if (categoryRepository.existsBySlugAndIdNot(slug, id)) {
            throw new RuntimeException("Slug '" + slug + "' đã tồn tại trên một danh mục khác");
        }

        category.setName(request.getName().trim());
        category.setSlug(slug);
        category.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }

        Category updated = categoryRepository.save(category);
        return CategoryAdminResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public void deleteCategory(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + id));

        // Xóa mềm: Chuyển isActive sang false
        category.setIsActive(false);
        categoryRepository.save(category);
    }
}

