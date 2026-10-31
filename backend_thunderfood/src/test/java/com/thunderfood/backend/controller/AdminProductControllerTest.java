package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.dto.product.CategoryBriefDto;
import com.thunderfood.backend.dto.product.ProductAdminResponse;
import com.thunderfood.backend.dto.product.ProductCreateRequest;
import com.thunderfood.backend.dto.product.ProductUpdateRequest;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.ProductService;
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

import java.math.BigDecimal;
import java.util.Collections;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminProductControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ProductService productService;

    @InjectMocks
    private AdminProductController adminProductController;

    private ObjectMapper objectMapper;
    private ProductAdminResponse adminResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminProductController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        objectMapper = new ObjectMapper();

        adminResponse = ProductAdminResponse.builder()
                .id(1L)
                .name("Cơm gà Hội An")
                .slug("com-ga-hoi-an")
                .category(CategoryBriefDto.builder().id(1).name("Cơm trưa").slug("com-trua").build())
                .price(new BigDecimal("55000"))
                .discountPrice(new BigDecimal("50000"))
                .stockQuantity(100)
                .soldCount(0)
                .avgRating(BigDecimal.ZERO)
                .isAvailable(true)
                .description("Cơm gà Hội An thơm ngon")
                .images(Collections.emptyList())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/products/{id} trả về thông tin món ăn thành công")
    void testGetProductById() throws Exception {
        when(productService.getProductDetailForAdmin(1L)).thenReturn(adminResponse);

        mockMvc.perform(get("/api/v1/admin/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)))
                .andExpect(jsonPath("$.data.name", is("Cơm gà Hội An")))
                .andExpect(jsonPath("$.data.slug", is("com-ga-hoi-an")));
    }

    @Test
    @DisplayName("POST /api/v1/admin/products tạo món ăn mới thành công")
    void testCreateProductSuccess() throws Exception {
        ProductCreateRequest request = ProductCreateRequest.builder()
                .name("Cơm gà Hội An")
                .categoryId(1)
                .price(new BigDecimal("55000"))
                .discountPrice(new BigDecimal("50000"))
                .stockQuantity(100)
                .description("Cơm gà Hội An thơm ngon")
                .isAvailable(true)
                .build();

        when(productService.createProduct(any(ProductCreateRequest.class))).thenReturn(adminResponse);

        mockMvc.perform(post("/api/v1/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)))
                .andExpect(jsonPath("$.data.name", is("Cơm gà Hội An")));
    }

    @Test
    @DisplayName("POST /api/v1/admin/products trả về lỗi 400 khi thiếu các trường bắt buộc")
    void testCreateProductValidationError() throws Exception {
        ProductCreateRequest invalidRequest = ProductCreateRequest.builder()
                .name("") // Rỗng -> lỗi validation
                .categoryId(null)
                .price(null)
                .build();

        mockMvc.perform(post("/api/v1/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/products/{id} cập nhật món ăn thành công")
    void testUpdateProductSuccess() throws Exception {
        ProductUpdateRequest request = ProductUpdateRequest.builder()
                .name("Cơm gà Hội An Đặc Biệt")
                .categoryId(1)
                .price(new BigDecimal("60000"))
                .build();

        ProductAdminResponse updatedResponse = ProductAdminResponse.builder()
                .id(1L)
                .name("Cơm gà Hội An Đặc Biệt")
                .slug("com-ga-hoi-an-dac-biet")
                .price(new BigDecimal("60000"))
                .build();

        when(productService.updateProduct(eq(1L), any(ProductUpdateRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(put("/api/v1/admin/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Cơm gà Hội An Đặc Biệt")));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/products/{id} xóa mềm món ăn thành công")
    void testDeleteProductSuccess() throws Exception {
        doNothing().when(productService).deleteProduct(1L);

        mockMvc.perform(delete("/api/v1/admin/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Xóa mềm món ăn thành công (ngừng kinh doanh và xóa khỏi giỏ hàng)")));
    }
}
