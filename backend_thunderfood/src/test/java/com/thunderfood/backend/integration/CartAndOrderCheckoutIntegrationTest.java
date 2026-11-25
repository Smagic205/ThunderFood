package com.thunderfood.backend.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.thunderfood.backend.dto.cart.AddToCartRequest;
import com.thunderfood.backend.dto.order.CancelOrderRequest;
import com.thunderfood.backend.dto.order.CheckoutPreviewRequest;
import com.thunderfood.backend.dto.order.PlaceOrderRequest;
import com.thunderfood.backend.entity.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CartAndOrderCheckoutIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("IT-03: Luồng Giỏ hàng -> Preview Checkout -> Đặt hàng trừ kho & ghi lịch sử -> Hủy đơn hoàn kho")
    void cartPreviewPlaceOrderAndCancelFlow() throws Exception {
        User customer = createUser("khach.it03@gmail.com", "Khách Hàng IT", "Customer1@", "0901122334", "CUSTOMER", "ACTIVE");
        String token = loginAndGetAccessToken("khach.it03@gmail.com", "Customer1@");

        Category category = categoryRepository.save(Category.builder()
                .name("Gà Rán")
                .slug("ga-ran")
                .isActive(true)
                .build());

        Product product = productRepository.save(Product.builder()
                .category(category)
                .name("Gà Rán Giòn")
                .slug("ga-ran-gion")
                .price(new BigDecimal("60000"))
                .stockQuantity(10)
                .soldCount(5)
                .isAvailable(true)
                .build());

        ServiceWard ward = serviceWardRepository.save(ServiceWard.builder()
                .wardName("Yên Lãng")
                .district("Đống Đa")
                .type("PHUONG")
                .shippingFee(new BigDecimal("20000"))
                .isActive(true)
                .build());

        Address address = addressRepository.save(Address.builder()
                .user(customer)
                .receiverName("Khách Hàng IT")
                .phone("0901122334")
                .ward(ward)
                .detailAddress("120 Yên Lãng")
                .isDefault(true)
                .build());

        voucherRepository.save(Voucher.builder()
                .code("GIAM15K")
                .name("Giảm 15k đơn từ 100k")
                .voucherType("PRODUCT")
                .discountType("FIXED_AMOUNT")
                .discountValue(new BigDecimal("15000"))
                .minOrderAmount(new BigDecimal("100000"))
                .usageLimit(50)
                .usedCount(0)
                .usageLimitPerUser(2)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(7))
                .isActive(true)
                .build());

        voucherRepository.save(Voucher.builder()
                .code("SHIP10K")
                .name("Giảm 10k phí giao hàng")
                .voucherType("SHIPPING")
                .discountType("FIXED_AMOUNT")
                .discountValue(new BigDecimal("10000"))
                .minOrderAmount(new BigDecimal("50000"))
                .usageLimit(50)
                .usedCount(0)
                .usageLimitPerUser(2)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(7))
                .isActive(true)
                .build());

        // 1. Thêm 2 phần gà vào giỏ (subtotal = 120,000đ)
        AddToCartRequest addReq = AddToCartRequest.builder()
                .productId(product.getId())
                .quantity(2)
                .build();

        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalQuantity", is(2)));

        // 2. Preview Checkout: 120,000 - 15,000 + (20,000 - 10,000) = 115,000đ
        CheckoutPreviewRequest previewReq = CheckoutPreviewRequest.builder()
                .addressId(address.getId())
                .productVoucherCode("GIAM15K")
                .shippingVoucherCode("SHIP10K")
                .build();

        MvcResult previewRes = mockMvc.perform(post("/api/v1/orders/checkout/preview")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(previewReq)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode previewData = objectMapper.readTree(previewRes.getResponse().getContentAsString()).path("data");
        assertThat(new BigDecimal(previewData.path("subtotalAmount").asText())).isEqualByComparingTo("120000");
        assertThat(new BigDecimal(previewData.path("discountAmount").asText())).isEqualByComparingTo("15000");
        assertThat(new BigDecimal(previewData.path("finalShippingFee").asText())).isEqualByComparingTo("10000");
        assertThat(new BigDecimal(previewData.path("totalAmount").asText())).isEqualByComparingTo("115000");

        // 3. Đặt hàng chính thức
        PlaceOrderRequest placeReq = PlaceOrderRequest.builder()
                .addressId(address.getId())
                .productVoucherCode("GIAM15K")
                .shippingVoucherCode("SHIP10K")
                .paymentMethod("COD")
                .note("Giao giờ trưa")
                .build();

        MvcResult orderRes = mockMvc.perform(post("/api/v1/orders/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(placeReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("PENDING")))
                .andReturn();

        JsonNode orderJson = objectMapper.readTree(orderRes.getResponse().getContentAsString());
        assertThat(new BigDecimal(orderJson.path("data").path("totalAmount").asText())).isEqualByComparingTo("115000");
        Long orderId = orderJson.path("data").path("id").asLong();

        // Kiểm chứng DB thực tế: trừ kho (10 -> 8), tăng soldCount (5 -> 7), xóa giỏ hàng, ghi lịch sử
        Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updatedProduct.getStockQuantity()).isEqualTo(8);
        assertThat(updatedProduct.getSoldCount()).isEqualTo(7);

        Cart cart = cartRepository.findByUserId(customer.getId()).orElseThrow();
        assertThat(cartItemRepository.findByCartId(cart.getId())).isEmpty();
        assertThat(orderStatusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(orderId)).hasSize(1);
        assertThat(voucherUsageRepository.count()).isEqualTo(2);

        // 4. Hủy đơn khi còn PENDING -> trạng thái CANCELLED & hoàn kho về 10
        CancelOrderRequest cancelReq = CancelOrderRequest.builder().reason("Đổi ý đặt món khác").build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CANCELLED")));

        Product restoredProduct = productRepository.findById(product.getId()).orElseThrow();
        assertThat(restoredProduct.getStockQuantity()).isEqualTo(10);
        assertThat(restoredProduct.getSoldCount()).isEqualTo(5);
    }
}
