package com.thunderfood.backend.integration;

import com.thunderfood.backend.entity.Category;
import com.thunderfood.backend.entity.Product;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProductSearchFilterPaginationIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("IT-02: Tìm kiếm, lọc đa tiêu chí (danh mục, giá, rating, giảm giá) và phân trang bằng JPA Specification")
    void searchFilterSortAndPaginateProducts() throws Exception {
        Category burgerCat = categoryRepository.save(Category.builder()
                .name("Burger")
                .slug("burger")
                .isActive(true)
                .build());

        Category drinkCat = categoryRepository.save(Category.builder()
                .name("Đồ uống")
                .slug("do-uong")
                .isActive(true)
                .build());

        // Món khớp mọi điều kiện: burger, keyword "Gà", giá 50k-100k, rating >= 4.0, có giảm giá
        productRepository.save(Product.builder()
                .category(burgerCat)
                .name("Burger Gà Giòn Cay")
                .slug("burger-ga-gion-cay")
                .price(new BigDecimal("85000"))
                .discountPrice(new BigDecimal("69000"))
                .stockQuantity(30)
                .soldCount(150)
                .avgRating(new BigDecimal("4.8"))
                .isAvailable(true)
                .build());

        productRepository.save(Product.builder()
                .category(burgerCat)
                .name("Burger Gà Phô Mai")
                .slug("burger-ga-pho-mai")
                .price(new BigDecimal("75000"))
                .discountPrice(new BigDecimal("59000"))
                .stockQuantity(20)
                .soldCount(120)
                .avgRating(new BigDecimal("4.5"))
                .isAvailable(true)
                .build());

        productRepository.save(Product.builder()
                .category(burgerCat)
                .name("Burger Gà Thượng Hạng")
                .slug("burger-ga-thuong-hang")
                .price(new BigDecimal("99000"))
                .discountPrice(new BigDecimal("79000"))
                .stockQuantity(10)
                .soldCount(40)
                .avgRating(new BigDecimal("4.2"))
                .isAvailable(true)
                .build());

        // Món không giảm giá -> bị loại khi hasDiscount=true
        productRepository.save(Product.builder()
                .category(burgerCat)
                .name("Burger Gà Truyền Thống")
                .slug("burger-ga-truyen-thong")
                .price(new BigDecimal("65000"))
                .discountPrice(null)
                .stockQuantity(25)
                .soldCount(90)
                .avgRating(new BigDecimal("4.6"))
                .isAvailable(true)
                .build());

        // Món đã ngừng bán -> luôn bị loại khỏi thực đơn khách hàng
        productRepository.save(Product.builder()
                .category(burgerCat)
                .name("Burger Gà Tạm Ngưng")
                .slug("burger-ga-tam-ngung")
                .price(new BigDecimal("80000"))
                .discountPrice(new BigDecimal("60000"))
                .stockQuantity(10)
                .soldCount(10)
                .avgRating(new BigDecimal("4.9"))
                .isAvailable(false)
                .build());

        // Món khác danh mục
        productRepository.save(Product.builder()
                .category(drinkCat)
                .name("Trà Gà Xả")
                .slug("tra-ga-xa")
                .price(new BigDecimal("60000"))
                .discountPrice(new BigDecimal("55000"))
                .stockQuantity(50)
                .soldCount(200)
                .avgRating(new BigDecimal("4.7"))
                .isAvailable(true)
                .build());

        // Trang 1 (size=2, sort=priceAsc): trả 2 món rẻ nhất trong 3 món khớp -> 59k, 69k
        mockMvc.perform(get("/api/v1/products")
                        .param("keyword", "Gà")
                        .param("categorySlug", "burger")
                        .param("priceRange", "m100")
                        .param("ratingRange", "above4")
                        .param("hasDiscount", "true")
                        .param("sort", "priceAsc")
                        .param("page", "1")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.content[0].slug", is("burger-ga-pho-mai")))
                .andExpect(jsonPath("$.data.content[1].slug", is("burger-ga-gion-cay")))
                .andExpect(jsonPath("$.data.pagination.page", is(1)))
                .andExpect(jsonPath("$.data.pagination.totalElements", is(3)))
                .andExpect(jsonPath("$.data.pagination.totalPages", is(2)))
                .andExpect(jsonPath("$.data.pagination.hasNext", is(true)))
                .andExpect(jsonPath("$.data.pagination.hasPrevious", is(false)));

        // Trang 2 (size=2): trả món còn lại (79k)
        mockMvc.perform(get("/api/v1/products")
                        .param("keyword", "Gà")
                        .param("categorySlug", "burger")
                        .param("priceRange", "m100")
                        .param("ratingRange", "above4")
                        .param("hasDiscount", "true")
                        .param("sort", "priceAsc")
                        .param("page", "2")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].slug", is("burger-ga-thuong-hang")))
                .andExpect(jsonPath("$.data.pagination.hasNext", is(false)))
                .andExpect(jsonPath("$.data.pagination.hasPrevious", is(true)));
    }
}
