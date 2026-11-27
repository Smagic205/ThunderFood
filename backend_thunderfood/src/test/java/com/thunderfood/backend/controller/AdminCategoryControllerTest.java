package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.dto.category.CategoryAdminResponse;
import com.thunderfood.backend.dto.category.CategoryRequest;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.service.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminCategoryControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private AdminCategoryController adminCategoryController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminCategoryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("AdminCategoryController CRUD và kiểm tra validation/404")
    void adminCategoryCrudAndValidation() throws Exception {
        CategoryAdminResponse cat = CategoryAdminResponse.builder()
                .id(1)
                .name("Cơm")
                .slug("com")
                .isActive(true)
                .build();

        when(categoryService.getAllCategoriesForAdmin()).thenReturn(List.of(cat));
        when(categoryService.getCategoryById(1)).thenReturn(cat);
        when(categoryService.getCategoryById(99)).thenThrow(new ResourceNotFoundException("Không tìm thấy"));
        when(categoryService.createCategory(any(CategoryRequest.class))).thenReturn(cat);
        when(categoryService.updateCategory(eq(1), any(CategoryRequest.class))).thenReturn(cat);
        doNothing().when(categoryService).deleteCategory(1);

        mockMvc.perform(get("/api/v1/admin/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));

        mockMvc.perform(get("/api/v1/admin/categories/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.slug", is("com")));

        mockMvc.perform(get("/api/v1/admin/categories/99"))
                .andExpect(status().isNotFound());

        CategoryRequest req = CategoryRequest.builder().name("Cơm").slug("com").build();
        mockMvc.perform(post("/api/v1/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CategoryRequest.builder().name("").slug("").build())))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/v1/admin/categories/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/admin/categories/1"))
                .andExpect(status().isOk());
    }
}
