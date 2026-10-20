package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.product.*;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ProductService productService;

    @InjectMocks
    private ProductController productController;

    private ProductListItemResponse itemResponse;
    private ProductDetailResponse detailResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(productController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        itemResponse = ProductListItemResponse.builder()
                .id(1L)
                .name("Trà đào cam sả")
                .slug("tra-dao-cam-sa")
                .categoryName("Đồ uống")
                .thumbnailUrl("https://cdn/tra-dao.png")
                .price(BigDecimal.valueOf(35000))
                .ratingAverage(4.8)
                .soldCount(4100)
                .soldCountDisplay("4,1k")
                .isFavorite(false)
                .cartQuantity(2)
                .canPurchase(false)
                .build();

        detailResponse = ProductDetailResponse.builder()
                .id(1L)
                .name("Trà đào cam sả")
                .slug("tra-dao-cam-sa")
                .category(CategoryBriefDto.builder().id(1).name("Đồ uống").slug("do-uong").build())
                .badges(List.of("Đồ uống", "Bán chạy"))
                .images(List.of(ProductImageDto.builder().url("https://cdn/tra-dao.png").isMain(true).build()))
                .ratingAverage(4.8)
                .reviewCount(35L)
                .soldCount(4100)
                .soldCountDisplay("4,1k")
                .price(BigDecimal.valueOf(35000))
                .description("Trà thơm thanh mát")
                .stockStatus(StockStatusDto.builder().code("IN_STOCK").label("Còn hàng").build())
                .delivery(DeliveryInfoDto.builder().estimateMinutes(30).freeShipThreshold(BigDecimal.valueOf(200000)).build())
                .highlights(List.of("Nấu tươi khi có đơn", "Đóng gói giữ nhiệt"))
                .details(ProductDetailsDto.builder()
                        .prepTime("10 đến 15 phút")
                        .consumeWithin("60 phút sau khi nhận")
                        .kitchenAddress("86 Hàng Bài, Hoàn Kiếm, Hà Nội")
                        .allergens("Có thể chứa gluten, sữa, trứng")
                        .build())
                .isFavorite(false)
                .cartQuantity(2)
                .canPurchase(false)
                .build();
    }

    @Test
    void getProducts_valid_returns200() throws Exception {
        PaginationInfo pagination = PaginationInfo.builder()
                .page(1)
                .size(15)
                .totalElements(1)
                .totalPages(1)
                .hasNext(false)
                .hasPrevious(false)
                .build();
        PageResponse<ProductListItemResponse> pageResponse = PageResponse.<ProductListItemResponse>builder()
                .content(List.of(itemResponse))
                .pagination(pagination)
                .build();

        when(productService.getProducts(any(ProductFilterRequest.class)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content[0].id", is(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Trà đào cam sả")))
                .andExpect(jsonPath("$.data.content[0].soldCountDisplay", is("4,1k")))
                .andExpect(jsonPath("$.data.pagination.page", is(1)))
                .andExpect(jsonPath("$.data.pagination.size", is(15)))
                .andExpect(jsonPath("$.data.pagination.totalElements", is(1)));
    }

    @Test
    void getProducts_withFilterParameters_returns200() throws Exception {
        PaginationInfo pagination = PaginationInfo.builder()
                .page(1)
                .size(15)
                .totalElements(1)
                .totalPages(1)
                .hasNext(false)
                .hasPrevious(false)
                .build();
        PageResponse<ProductListItemResponse> pageResponse = PageResponse.<ProductListItemResponse>builder()
                .content(List.of(itemResponse))
                .pagination(pagination)
                .build();

        when(productService.getProducts(argThat(filter ->
                "lt50".equals(filter.getPriceRange()) &&
                "above4".equals(filter.getRatingRange()) &&
                Boolean.TRUE.equals(filter.getHasDiscount()) &&
                "discountDesc".equals(filter.getSort()) &&
                Integer.valueOf(100).equals(filter.getMinSoldCount())
        ))).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/products?priceRange=lt50&ratingRange=above4&hasDiscount=true&sort=discountDesc&minSoldCount=100")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content[0].id", is(1)));
    }

    @Test
    void getProducts_invalidPage_returns400() throws Exception {
        when(productService.getProducts(argThat(f -> f != null && f.getPage() == 0)))
                .thenThrow(new IllegalArgumentException("Số trang (page) phải lớn hơn hoặc bằng 1"));

        mockMvc.perform(get("/api/v1/products?page=0")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Số trang (page) phải lớn hơn hoặc bằng 1")));
    }

    @Test
    void getProducts_invalidSize_returns400() throws Exception {
        when(productService.getProducts(argThat(f -> f != null && f.getSize() == 100)))
                .thenThrow(new IllegalArgumentException("Kích thước trang (size) phải từ 1 đến 50"));

        mockMvc.perform(get("/api/v1/products?size=100")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Kích thước trang (size) phải từ 1 đến 50")));
    }

    @Test
    void getProductById_found_returns200() throws Exception {
        when(productService.getProductById(1L)).thenReturn(detailResponse);

        mockMvc.perform(get("/api/v1/products/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)))
                .andExpect(jsonPath("$.data.category.name", is("Đồ uống")))
                .andExpect(jsonPath("$.data.badges[0]", is("Đồ uống")))
                .andExpect(jsonPath("$.data.badges[1]", is("Bán chạy")))
                .andExpect(jsonPath("$.data.stockStatus.code", is("IN_STOCK")))
                .andExpect(jsonPath("$.data.delivery.freeShipThreshold", is(200000)))
                .andExpect(jsonPath("$.data.details.prepTime", is("10 đến 15 phút")))
                .andExpect(jsonPath("$.data.canPurchase", is(false)));
    }

    @Test
    void getProductById_notFound_returns404() throws Exception {
        when(productService.getProductById(999L))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy sản phẩm"));

        mockMvc.perform(get("/api/v1/products/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Không tìm thấy sản phẩm")));
    }

    @Test
    void getProductBySlug_found_returns200() throws Exception {
        when(productService.getProductBySlug("tra-dao-cam-sa")).thenReturn(detailResponse);

        mockMvc.perform(get("/api/v1/products/slug/tra-dao-cam-sa")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.slug", is("tra-dao-cam-sa")));
    }

    @Test
    void getProductBySlug_notFound_returns404() throws Exception {
        when(productService.getProductBySlug("khong-ton-tai"))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy sản phẩm"));

        mockMvc.perform(get("/api/v1/products/slug/khong-ton-tai")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Không tìm thấy sản phẩm")));
    }

    @Test
    void getProductsByCategorySlug_found_returns200() throws Exception {
        PaginationInfo pagination = PaginationInfo.builder()
                .page(1)
                .size(15)
                .totalElements(1)
                .totalPages(1)
                .hasNext(false)
                .hasPrevious(false)
                .build();
        PageResponse<ProductListItemResponse> pageResponse = PageResponse.<ProductListItemResponse>builder()
                .content(List.of(itemResponse))
                .pagination(pagination)
                .build();

        when(productService.getProductsByCategorySlug(eq("do-uong"), any(ProductFilterRequest.class)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/products/category/do-uong")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content[0].name", is("Trà đào cam sả")))
                .andExpect(jsonPath("$.data.content[0].categoryName", is("Đồ uống")));
    }
}
