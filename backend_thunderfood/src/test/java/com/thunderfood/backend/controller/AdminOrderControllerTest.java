package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.dto.admin.AdminOrderResponse;
import com.thunderfood.backend.dto.admin.UpdateOrderStatusRequest;
import com.thunderfood.backend.dto.order.CancelOrderRequest;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.AdminOrderService;
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
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminOrderControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AdminOrderService adminOrderService;

    @InjectMocks
    private AdminOrderController adminOrderController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminOrderController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Admin lấy danh sách đơn hàng thành công - 200 OK")
    void testGetOrders_Success() throws Exception {
        AdminOrderResponse order = AdminOrderResponse.builder()
                .id(1L)
                .orderCode("ORD-1001")
                .receiverName("Nguyễn Văn A")
                .status("PENDING")
                .totalAmount(BigDecimal.valueOf(150000))
                .build();

        when(adminOrderService.getAllOrders(any(), any())).thenReturn(List.of(order));

        mockMvc.perform(get("/api/v1/admin/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].orderCode", is("ORD-1001")));
    }

    @Test
    @DisplayName("Admin lấy chi tiết đơn hàng theo orderCode thành công - 200 OK")
    void testGetOrderByCode_Success() throws Exception {
        AdminOrderResponse order = AdminOrderResponse.builder()
                .id(1L)
                .orderCode("ORD-1001")
                .receiverName("Nguyễn Văn A")
                .status("PENDING")
                .totalAmount(BigDecimal.valueOf(150000))
                .build();

        when(adminOrderService.getOrderByCode("ORD-1001")).thenReturn(order);

        mockMvc.perform(get("/api/v1/admin/orders/ORD-1001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.orderCode", is("ORD-1001")));
    }

    @Test
    @DisplayName("Admin cập nhật trạng thái đơn hàng thành công - 200 OK")
    void testUpdateStatus_Success() throws Exception {
        UpdateOrderStatusRequest request = UpdateOrderStatusRequest.builder()
                .status("CONFIRMED")
                .note("Đã gọi xác nhận với khách")
                .build();

        AdminOrderResponse response = AdminOrderResponse.builder()
                .id(1L)
                .orderCode("ORD-1001")
                .status("CONFIRMED")
                .build();

        when(adminOrderService.updateOrderStatus(eq(1L), any(UpdateOrderStatusRequest.class), any())).thenReturn(response);

        mockMvc.perform(put("/api/v1/admin/orders/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("CONFIRMED")));
    }

    @Test
    @DisplayName("Admin hủy đơn hàng thành công - 200 OK")
    void testCancelOrder_Success() throws Exception {
        CancelOrderRequest request = new CancelOrderRequest();
        request.setReason("Hết nguyên liệu món chính");

        AdminOrderResponse response = AdminOrderResponse.builder()
                .id(1L)
                .orderCode("ORD-1001")
                .status("CANCELLED")
                .build();

        when(adminOrderService.cancelOrder(eq(1L), any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/admin/orders/1/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("CANCELLED")));
    }
}
