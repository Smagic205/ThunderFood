package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.category.CategoryResponse;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.CategoryService;
import com.thunderfood.backend.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CategoryService categoryService;

    @Mock
    private ProductService productService;

    @InjectMocks
    private CategoryController categoryController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(categoryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/categories và /{slug}/products trả về 200")
    void getCategoriesAndProductsBySlug() throws Exception {
        when(categoryService.getActiveCategories()).thenReturn(
                List.of(CategoryResponse.builder().id(1).name("Cơm").slug("com").build())
        );
        when(productService.getProductsByCategorySlug(eq("com"), any()))
                .thenReturn(PageResponse.<com.thunderfood.backend.dto.product.ProductListItemResponse>builder()
                        .content(List.of())
                        .pagination(PaginationInfo.builder().page(0).size(10).totalElements(0).totalPages(0).build())
                        .build());

        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].slug", is("com")));

        mockMvc.perform(get("/api/v1/categories/com/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
