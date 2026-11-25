package com.thunderfood.backend.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.thunderfood.backend.dto.cart.AddToCartRequest;
import com.thunderfood.backend.dto.product.ProductCreateRequest;
import com.thunderfood.backend.dto.product.ProductImageRequest;
import com.thunderfood.backend.dto.product.ProductUpdateRequest;
import com.thunderfood.backend.entity.Cart;
import com.thunderfood.backend.entity.Category;
import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.entity.Product;
import com.thunderfood.backend.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminProductAndDashboardIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("IT-05: Admin Validation, CRUD Món ăn, Xóa mềm dọn giỏ hàng & Thống kê Dashboard")
    void adminProductCrudSoftDeleteAndDashboardSummary() throws Exception {
        createUser("admin.it05@thunderfood.vn", "Admin IT05", "AdminPass1@", "0933445566", "ADMIN", "ACTIVE");
        User customer = createUser("khach.it05@gmail.com", "Khách IT05", "Customer1@", "0944556677", "CUSTOMER", "ACTIVE");

        String adminToken = loginAndGetAccessToken("admin.it05@thunderfood.vn", "AdminPass1@");
        String customerToken = loginAndGetAccessToken("khach.it05@gmail.com", "Customer1@");

        Category category = categoryRepository.save(Category.builder()
                .name("Combo")
                .slug("combo")
                .isActive(true)
                .build());

        // 1. Kiểm chứng Server Validation (@Valid): giá <= 0 -> 400 Bad Request
        ProductCreateRequest invalidReq = ProductCreateRequest.builder()
                .name("")
                .categoryId(category.getId())
                .price(BigDecimal.ZERO)
                .build();

        mockMvc.perform(post("/api/v1/admin/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        // 2. Tạo mới món ăn hợp lệ -> 201 Created
        ProductCreateRequest validCreateReq = ProductCreateRequest.builder()
                .name("Combo Gà Đôi Siêu Tiết Kiệm")
                .categoryId(category.getId())
                .price(new BigDecimal("150000"))
                .discountPrice(new BigDecimal("129000"))
                .stockQuantity(40)
                .description("2 miếng gà giòn + khoai tây + 2 nước")
                .isAvailable(true)
                .images(List.of(ProductImageRequest.builder()
                        .imageUrl("https://cdn.example.com/combo1.jpg")
                        .isThumbnail(true)
                        .sortOrder(0)
                        .build()))
                .build();

        MvcResult createRes = mockMvc.perform(post("/api/v1/admin/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validCreateReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.slug", is("combo-ga-doi-sieu-tiet-kiem")))
                .andReturn();

        JsonNode createdJson = objectMapper.readTree(createRes.getResponse().getContentAsString());
        Long productId = createdJson.path("data").path("id").asLong();

        // 3. Cập nhật giá món ăn
        ProductUpdateRequest updateReq = ProductUpdateRequest.builder()
                .name("Combo Gà Đôi Đặc Biệt")
                .categoryId(category.getId())
                .price(new BigDecimal("160000"))
                .discountPrice(new BigDecimal("135000"))
                .stockQuantity(35)
                .isAvailable(true)
                .build();

        MvcResult updateRes = mockMvc.perform(put("/api/v1/admin/products/" + productId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name", is("Combo Gà Đôi Đặc Biệt")))
                .andReturn();

        JsonNode updatedJson = objectMapper.readTree(updateRes.getResponse().getContentAsString());
        assertThat(new BigDecimal(updatedJson.path("data").path("price").asText())).isEqualByComparingTo("160000");

        // 4. Khách thêm món vào giỏ hàng, sau đó Admin xóa mềm -> isAvailable=false & xóa khỏi giỏ
        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddToCartRequest(productId, 1))))
                .andExpect(status().isOk());

        Cart cart = cartRepository.findByUserId(customer.getId()).orElseThrow();
        assertThat(cartItemRepository.findByCartId(cart.getId())).hasSize(1);

        mockMvc.perform(delete("/api/v1/admin/products/" + productId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        Product softDeleted = productRepository.findById(productId).orElseThrow();
        assertThat(softDeleted.getIsAvailable()).isFalse();
        assertThat(cartItemRepository.findByCartId(cart.getId())).isEmpty();

        // 5. Tạo đơn DELIVERED và kiểm tra Dashboard Summary tính đúng doanh thu từ DB
        orderRepository.save(Order.builder()
                .orderCode("TF-IT05-DELIVERED")
                .user(customer)
                .receiverName("Khách IT05")
                .receiverPhone("0944556677")
                .shippingAddress("10 Hàng Bài, Hoàn Kiếm, Hà Nội")
                .subtotalAmount(new BigDecimal("250000"))
                .discountAmount(BigDecimal.ZERO)
                .originalShippingFee(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("250000"))
                .status("DELIVERED")
                .paymentMethod("COD")
                .paymentStatus("PAID")
                .build());

        MvcResult dashRes = mockMvc.perform(get("/api/v1/admin/dashboard/summary")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("period", "THIS_MONTH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deliveredOrders", is(1)))
                .andReturn();

        JsonNode dashData = objectMapper.readTree(dashRes.getResponse().getContentAsString()).path("data");
        assertThat(new BigDecimal(dashData.path("totalRevenue").asText())).isEqualByComparingTo("250000");
    }
}
