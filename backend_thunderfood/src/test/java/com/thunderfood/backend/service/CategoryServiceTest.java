package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.category.CategoryAdminResponse;
import com.thunderfood.backend.dto.category.CategoryRequest;
import com.thunderfood.backend.dto.category.CategoryResponse;
import com.thunderfood.backend.entity.Category;
import com.thunderfood.backend.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    private Category category1;
    private Category category2;

    @BeforeEach
    void setUp() {
        category1 = Category.builder()
                .id(1)
                .name("Đồ ăn nhanh")
                .slug("do-an-nhanh")
                .description("Các món đồ ăn nhanh hấp dẫn")
                .isActive(true)
                .build();

        category2 = Category.builder()
                .id(2)
                .name("Đồ uống")
                .slug("do-uong")
                .description("Trà sữa, cà phê, nước ép")
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("getActiveCategories trả về danh sách các danh mục đang hoạt động")
    void testGetActiveCategories() {
        when(categoryRepository.findByIsActiveTrueOrderByIdAsc()).thenReturn(List.of(category1, category2));

        List<CategoryResponse> responses = categoryService.getActiveCategories();

        assertEquals(2, responses.size());
        assertEquals("Đồ ăn nhanh", responses.get(0).getName());
        assertEquals("do-an-nhanh", responses.get(0).getSlug());
    }

    @Test
    @DisplayName("getAllCategoriesForAdmin trả về toàn bộ danh mục cho Admin")
    void testGetAllCategoriesForAdmin() {
        Category inactiveCategory = Category.builder()
                .id(3)
                .name("Món tráng miệng")
                .slug("mon-trang-mieng")
                .isActive(false)
                .build();

        when(categoryRepository.findAllByOrderByIdAsc()).thenReturn(List.of(category1, category2, inactiveCategory));

        List<CategoryAdminResponse> responses = categoryService.getAllCategoriesForAdmin();

        assertEquals(3, responses.size());
        assertFalse(responses.get(2).getIsActive());
    }

    @Test
    @DisplayName("getCategoryById thành công khi ID tồn tại")
    void testGetCategoryById_Success() {
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category1));

        CategoryAdminResponse response = categoryService.getCategoryById(1);

        assertNotNull(response);
        assertEquals("Đồ ăn nhanh", response.getName());
    }

    @Test
    @DisplayName("getCategoryById ném ngoại lệ khi không tìm thấy danh mục")
    void testGetCategoryById_NotFound() {
        when(categoryRepository.findById(99)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> categoryService.getCategoryById(99));
        assertTrue(ex.getMessage().contains("Không tìm thấy danh mục với ID: 99"));
    }

    @Test
    @DisplayName("createCategory tạo danh mục mới thành công")
    void testCreateCategory_Success() {
        CategoryRequest request = CategoryRequest.builder()
                .name("Lẩu & Nướng")
                .slug("lau-nuong")
                .description("Các combo lẩu nướng")
                .isActive(true)
                .build();

        Category savedCategory = Category.builder()
                .id(4)
                .name("Lẩu & Nướng")
                .slug("lau-nuong")
                .description("Các combo lẩu nướng")
                .isActive(true)
                .build();

        when(categoryRepository.existsBySlug("lau-nuong")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(savedCategory);

        CategoryAdminResponse response = categoryService.createCategory(request);

        assertNotNull(response);
        assertEquals(4, response.getId());
        assertEquals("Lẩu & Nướng", response.getName());
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    @DisplayName("createCategory ném ngoại lệ khi slug đã tồn tại")
    void testCreateCategory_SlugDuplicate() {
        CategoryRequest request = CategoryRequest.builder()
                .name("Đồ ăn nhanh mới")
                .slug("do-an-nhanh")
                .build();

        when(categoryRepository.existsBySlug("do-an-nhanh")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> categoryService.createCategory(request));
        assertTrue(ex.getMessage().contains("Slug 'do-an-nhanh' đã tồn tại"));
        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateCategory cập nhật thông tin thành công")
    void testUpdateCategory_Success() {
        CategoryRequest request = CategoryRequest.builder()
                .name("Đồ ăn nhanh cập nhật")
                .slug("do-an-nhanh-update")
                .description("Mô tả mới")
                .isActive(true)
                .build();

        when(categoryRepository.findById(1)).thenReturn(Optional.of(category1));
        when(categoryRepository.existsBySlugAndIdNot("do-an-nhanh-update", 1)).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CategoryAdminResponse response = categoryService.updateCategory(1, request);

        assertNotNull(response);
        assertEquals("Đồ ăn nhanh cập nhật", response.getName());
        assertEquals("do-an-nhanh-update", response.getSlug());
    }

    @Test
    @DisplayName("updateCategory ném ngoại lệ khi trùng slug với danh mục khác")
    void testUpdateCategory_SlugDuplicate() {
        CategoryRequest request = CategoryRequest.builder()
                .name("Đổi tên")
                .slug("do-uong") // Đã thuộc category 2
                .build();

        when(categoryRepository.findById(1)).thenReturn(Optional.of(category1));
        when(categoryRepository.existsBySlugAndIdNot("do-uong", 1)).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> categoryService.updateCategory(1, request));
        assertTrue(ex.getMessage().contains("Slug 'do-uong' đã tồn tại trên một danh mục khác"));
        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("deleteCategory thực hiện xóa mềm (chuyển isActive = false)")
    void testDeleteCategory_SoftDelete() {
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category1));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        categoryService.deleteCategory(1);

        assertFalse(category1.getIsActive());
        verify(categoryRepository).save(category1);
    }
}
