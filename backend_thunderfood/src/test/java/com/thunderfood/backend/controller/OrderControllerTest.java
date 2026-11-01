package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.order.*;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.OrderService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    private MockMvc mockMvc;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderController orderController;

    private ObjectMapper objectMapper;
    private User mockUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(orderController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        mockUser = User.builder()
                .id(1L)
                .fullName("Nguyễn Văn A")
                .email("user@thunderfood.vn")
                .role(Role.builder().id(1).name("CUSTOMER").build())
                .build();

        UserDetailsImpl userDetails = new UserDetailsImpl(mockUser);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("POST /api/v1/orders/checkout/preview trả về 200 và chi phí tính toán")
    void testPreviewCheckout() throws Exception {
        CheckoutPreviewRequest req = CheckoutPreviewRequest.builder()
                .addressId(10L)
                .productVoucherCode("DISCOUNT20")
                .build();

        CheckoutPreviewResponse resp = CheckoutPreviewResponse.builder()
                .subtotalAmount(new BigDecimal("150000.00"))
                .originalShippingFee(new BigDecimal("20000.00"))
                .finalShippingFee(new BigDecimal("20000.00"))
                .totalAmount(new BigDecimal("170000.00"))
                .build();

        when(orderService.previewCheckout(eq(1L), any(CheckoutPreviewRequest.class))).thenReturn(resp);

        mockMvc.perform(post("/api/v1/orders/checkout/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.subtotalAmount", is(150000.00)))
                .andExpect(jsonPath("$.data.totalAmount", is(170000.00)));
    }

    @Test
    @DisplayName("POST /api/v1/orders/checkout trả về 201 Created khi đặt đơn thành công")
    void testPlaceOrder() throws Exception {
        PlaceOrderRequest req = PlaceOrderRequest.builder()
                .addressId(10L)
                .paymentMethod("COD")
                .note("Giao nhanh nhé")
                .build();

        OrderResponse resp = OrderResponse.builder()
                .id(100L)
                .orderCode("TF261101894215")
                .status("PENDING")
                .paymentMethod("COD")
                .paymentStatus("UNPAID")
                .totalAmount(new BigDecimal("170000.00"))
                .build();

        when(orderService.placeOrder(eq(1L), any(PlaceOrderRequest.class))).thenReturn(resp);

        mockMvc.perform(post("/api/v1/orders/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(100)))
                .andExpect(jsonPath("$.data.orderCode", is("TF261101894215")))
                .andExpect(jsonPath("$.data.status", is("PENDING")));
    }

    @Test
    @DisplayName("POST /api/v1/orders/checkout trả về 400 Bad Request khi thiếu phương thức thanh toán")
    void testPlaceOrder_MissingPaymentMethod() throws Exception {
        PlaceOrderRequest req = PlaceOrderRequest.builder()
                .addressId(10L)
                .paymentMethod("") // Blank
                .build();

        mockMvc.perform(post("/api/v1/orders/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("GET /api/v1/orders trả về danh sách lịch sử đơn hàng phân trang")
    void testGetMyOrders() throws Exception {
        OrderListResponse item = OrderListResponse.builder()
                .id(100L)
                .orderCode("TF261101894215")
                .status("PENDING")
                .totalAmount(new BigDecimal("170000.00"))
                .build();

        PageResponse<OrderListResponse> pageResp = PageResponse.<OrderListResponse>builder()
                .content(List.of(item))
                .pagination(PaginationInfo.builder().page(0).size(10).totalElements(1).totalPages(1).build())
                .build();

        when(orderService.getUserOrders(eq(1L), any(), any())).thenReturn(pageResp);

        mockMvc.perform(get("/api/v1/orders")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content[0].orderCode", is("TF261101894215")));
    }

    @Test
    @DisplayName("GET /api/v1/orders/{id} trả về chi tiết đơn hàng")
    void testGetOrderDetail() throws Exception {
        OrderResponse resp = OrderResponse.builder()
                .id(100L)
                .orderCode("TF261101894215")
                .status("PENDING")
                .totalAmount(new BigDecimal("170000.00"))
                .build();

        when(orderService.getOrderDetail(1L, 100L)).thenReturn(resp);

        mockMvc.perform(get("/api/v1/orders/{id}", 100L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.orderCode", is("TF261101894215")));
    }

    @Test
    @DisplayName("GET /api/v1/orders/{id}/tracking trả về tiến trình và timeline")
    void testGetOrderTracking() throws Exception {
        OrderTrackingResponse tracking = OrderTrackingResponse.builder()
                .orderId(100L)
                .orderCode("TF261101894215")
                .currentStatus("PENDING")
                .timeline(Collections.emptyList())
                .build();

        when(orderService.getOrderTracking(1L, 100L)).thenReturn(tracking);

        mockMvc.perform(get("/api/v1/orders/{id}/tracking", 100L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.currentStatus", is("PENDING")));
    }

    @Test
    @DisplayName("POST /api/v1/orders/{id}/cancel trả về 200 khi hủy đơn thành công")
    void testCancelOrder() throws Exception {
        CancelOrderRequest req = CancelOrderRequest.builder().reason("Đổi ý").build();

        OrderResponse resp = OrderResponse.builder()
                .id(100L)
                .orderCode("TF261101894215")
                .status("CANCELLED")
                .build();

        when(orderService.cancelOrder(eq(1L), eq(100L), any(CancelOrderRequest.class))).thenReturn(resp);

        mockMvc.perform(post("/api/v1/orders/{id}/cancel", 100L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("CANCELLED")));
    }
}
