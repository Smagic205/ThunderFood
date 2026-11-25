package com.thunderfood.backend.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.thunderfood.backend.dto.staff.ConfirmOrderRequest;
import com.thunderfood.backend.entity.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class StaffOrderDeliveryWorkflowIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("IT-04: Luồng Staff lọc đơn địa bàn -> Xác nhận gom gói -> Shipper nhận gói -> Giao thành công COD")
    void staffConfirmClaimAndDeliverWorkflow() throws Exception {
        User customer = createUser("khach.it04@gmail.com", "Khách IT04", "Customer1@", "0911223344", "CUSTOMER", "ACTIVE");
        createUser("staff.it04@thunderfood.vn", "Shipper Hùng", "StaffPass1@", "0922334455", "STAFF", "ACTIVE");
        String staffToken = loginAndGetAccessToken("staff.it04@thunderfood.vn", "StaffPass1@");

        ServiceWard ward = serviceWardRepository.save(ServiceWard.builder()
                .wardName("Trung Tự")
                .district("Đống Đa")
                .type("PHUONG")
                .shippingFee(new BigDecimal("15000"))
                .isActive(true)
                .build());

        Address address = addressRepository.save(Address.builder()
                .user(customer)
                .receiverName("Khách IT04")
                .phone("0911223344")
                .ward(ward)
                .detailAddress("Ngõ 46B Phạm Ngọc Thạch")
                .isDefault(true)
                .build());

        Order order = orderRepository.save(Order.builder()
                .orderCode("TF-IT04-001")
                .user(customer)
                .address(address)
                .receiverName("Khách IT04")
                .receiverPhone("0911223344")
                .shippingAddress("Ngõ 46B Phạm Ngọc Thạch, Phường Trung Tự, Hà Nội")
                .subtotalAmount(new BigDecimal("90000"))
                .discountAmount(BigDecimal.ZERO)
                .originalShippingFee(new BigDecimal("15000"))
                .shippingFee(new BigDecimal("15000"))
                .totalAmount(new BigDecimal("105000"))
                .status("PENDING")
                .paymentMethod("COD")
                .paymentStatus("UNPAID")
                .build());

        // 1. Staff lọc đơn theo Quận -> Phường -> Trạng thái PENDING
        mockMvc.perform(get("/api/v1/staff/orders")
                        .header("Authorization", "Bearer " + staffToken)
                        .param("district", "Đống Đa")
                        .param("ward", "Trung Tự")
                        .param("status", "PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].orderCode", is("TF-IT04-001")));

        // 2. Staff xác nhận đơn & tạo gói giao hàng mới
        ConfirmOrderRequest confirmReq = ConfirmOrderRequest.builder()
                .packageName("GOI-DONG-DA-01")
                .isNewPackage(true)
                .build();

        MvcResult confirmRes = mockMvc.perform(post("/api/v1/staff/orders/" + order.getId() + "/confirm")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CONFIRMED")))
                .andReturn();

        JsonNode confirmJson = objectMapper.readTree(confirmRes.getResponse().getContentAsString());
        Long packageId = confirmJson.path("data").path("packageId").asLong();
        assertThat(packageId).isPositive();

        // 3. Shipper nhận giao gói hàng -> Gói & đơn chuyển sang DELIVERING
        mockMvc.perform(post("/api/v1/staff/orders/packages/" + packageId + "/claim")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("DELIVERING")));

        Order deliveringOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(deliveringOrder.getStatus()).isEqualTo("DELIVERING");

        // 4. Shipper xác nhận giao thành công -> đơn DELIVERED, COD -> PAID, gói tự động COMPLETED
        mockMvc.perform(post("/api/v1/staff/orders/" + order.getId() + "/deliver")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("DELIVERED")))
                .andExpect(jsonPath("$.data.paymentStatus", is("PAID")));

        DeliveryPackage completedPkg = deliveryPackageRepository.findById(packageId).orElseThrow();
        assertThat(completedPkg.getStatus()).isEqualTo("COMPLETED");
        assertThat(completedPkg.getCompletedAt()).isNotNull();
        assertThat(orderStatusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(order.getId())).hasSize(3);
    }
}
