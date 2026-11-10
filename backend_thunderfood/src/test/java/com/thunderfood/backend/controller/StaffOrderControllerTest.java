package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.order.CancelOrderRequest;
import com.thunderfood.backend.dto.staff.*;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.StaffOrderService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class StaffOrderControllerTest {

    private MockMvc mockMvc;

    @Mock
    private StaffOrderService staffOrderService;

    @InjectMocks
    private StaffOrderController staffOrderController;

    private ObjectMapper objectMapper;
    private User staffUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(staffOrderController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        staffUser = User.builder()
                .id(99L)
                .email("staff@thunderfood.vn")
                .fullName("Nhân Viên Vận Hành")
                .role(Role.builder().id(2).name("STAFF").build())
                .status("ACTIVE")
                .build();

        UserDetailsImpl userDetails = new UserDetailsImpl(staffUser);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Lấy danh sách đơn hàng cho Staff - Trả về 200 OK")
    void getOrders_Success() throws Exception {
        StaffOrderListResponse item = StaffOrderListResponse.builder()
                .id(1L)
                .orderCode("TF261110001")
                .status("PENDING")
                .receiverName("Khách A")
                .receiverPhone("0912345678")
                .totalAmount(BigDecimal.valueOf(120000))
                .build();

        PaginationInfo pagination = PaginationInfo.builder()
                .page(0)
                .size(15)
                .totalElements(1)
                .totalPages(1)
                .build();

        PageResponse<StaffOrderListResponse> pageResponse = PageResponse.<StaffOrderListResponse>builder()
                .content(List.of(item))
                .pagination(pagination)
                .build();

        when(staffOrderService.getStaffOrders(any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/staff/orders")
                        .param("status", "PENDING")
                        .param("district", "Đống Đa")
                        .param("ward", "Kim Liên")
                        .param("streetKeyword", "Yên Lãng"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SUCCESS")))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].orderCode", is("TF261110001")));
    }

    @Test
    @DisplayName("Lấy danh sách Quận đang phục vụ - Trả về 200 OK")
    void getDistricts_Success() throws Exception {
        when(staffOrderService.getDistricts()).thenReturn(List.of("Ba Đình", "Đống Đa"));

        mockMvc.perform(get("/api/v1/staff/orders/districts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SUCCESS")))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0]", is("Ba Đình")));
    }

    @Test
    @DisplayName("Nhân viên xác nhận đơn và gộp gói - Trả về 200 OK")
    void confirmOrder_Success() throws Exception {
        ConfirmOrderRequest request = ConfirmOrderRequest.builder()
                .packageName("GOI-DONGDA-01")
                .isNewPackage(false)
                .build();

        StaffOrderDetailResponse response = StaffOrderDetailResponse.builder()
                .id(1L)
                .orderCode("TF261110001")
                .status("CONFIRMED")
                .packageCode("GOI-DONGDA-01")
                .build();

        when(staffOrderService.confirmOrder(eq(1L), any(ConfirmOrderRequest.class), eq(99L)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/staff/orders/1/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SUCCESS")))
                .andExpect(jsonPath("$.data.status", is("CONFIRMED")))
                .andExpect(jsonPath("$.data.packageCode", is("GOI-DONGDA-01")));
    }

    @Test
    @DisplayName("Nhân viên hủy đơn tại quầy - Trả về 200 OK")
    void cancelOrder_Success() throws Exception {
        CancelOrderRequest request = CancelOrderRequest.builder()
                .reason("Khách xin hủy")
                .build();

        StaffOrderDetailResponse response = StaffOrderDetailResponse.builder()
                .id(1L)
                .orderCode("TF261110001")
                .status("CANCELLED")
                .build();

        when(staffOrderService.cancelOrderByStaff(eq(1L), any(CancelOrderRequest.class), eq(99L)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/staff/orders/1/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SUCCESS")))
                .andExpect(jsonPath("$.data.status", is("CANCELLED")));
    }

    @Test
    @DisplayName("Shipper nhận giao gói hàng - Trả về 200 OK")
    void claimPackage_Success() throws Exception {
        DeliveryPackageResponse response = DeliveryPackageResponse.builder()
                .id(10L)
                .packageName("GOI-DONGDA-01")
                .status("DELIVERING")
                .shippedByStaffId(99L)
                .build();

        when(staffOrderService.claimPackage(eq(10L), eq(99L))).thenReturn(response);

        mockMvc.perform(post("/api/v1/staff/orders/packages/10/claim"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SUCCESS")))
                .andExpect(jsonPath("$.data.status", is("DELIVERING")));
    }

    @Test
    @DisplayName("Shipper xác nhận đã giao từng đơn - Trả về 200 OK")
    void deliverOrder_Success() throws Exception {
        StaffOrderDetailResponse response = StaffOrderDetailResponse.builder()
                .id(1L)
                .orderCode("TF261110001")
                .status("DELIVERED")
                .paymentStatus("PAID")
                .deliveredAt(LocalDateTime.now())
                .build();

        when(staffOrderService.deliverOrder(eq(1L), eq(99L))).thenReturn(response);

        mockMvc.perform(post("/api/v1/staff/orders/1/deliver"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SUCCESS")))
                .andExpect(jsonPath("$.data.status", is("DELIVERED")))
                .andExpect(jsonPath("$.data.paymentStatus", is("PAID")));
    }

    @Test
    @DisplayName("Shipper báo giao thất bại - Trả về 200 OK")
    void failDelivery_Success() throws Exception {
        FailDeliveryRequest request = FailDeliveryRequest.builder()
                .reason("Khách boom hàng")
                .build();

        StaffOrderDetailResponse response = StaffOrderDetailResponse.builder()
                .id(1L)
                .orderCode("TF261110001")
                .status("CANCELLED")
                .build();

        when(staffOrderService.failDelivery(eq(1L), any(FailDeliveryRequest.class), eq(99L)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/staff/orders/1/fail")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SUCCESS")))
                .andExpect(jsonPath("$.data.status", is("CANCELLED")));
    }
}
