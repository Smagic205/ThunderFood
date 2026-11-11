package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.dto.address.ServiceWardResponse;
import com.thunderfood.backend.dto.address.UpdateShippingFeeRequest;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.ServiceWardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
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
class AdminServiceWardControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ServiceWardService serviceWardService;

    @InjectMocks
    private AdminServiceWardController adminServiceWardController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminServiceWardController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Admin lấy danh sách phường/xã phục vụ thành công - 200 OK")
    void getAllWards_Success() throws Exception {
        ServiceWardResponse ward = ServiceWardResponse.builder()
                .id(1)
                .wardName("Yên Lãng")
                .district("Đống Đa")
                .shippingFee(BigDecimal.valueOf(20000))
                .isActive(true)
                .build();

        PageResponse<ServiceWardResponse> pageResponse = PageResponse.<ServiceWardResponse>builder()
                .content(List.of(ward))
                .pagination(PaginationInfo.builder().page(0).size(15).totalElements(1).totalPages(1).build())
                .build();

        when(serviceWardService.getAllWardsForAdmin(any(), any(), any(), any(Pageable.class)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/admin/wards"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].wardName", is("Yên Lãng")));
    }

    @Test
    @DisplayName("Admin cập nhật phí giao hàng cho phường thành công - 200 OK")
    void updateShippingFee_Success() throws Exception {
        UpdateShippingFeeRequest request = UpdateShippingFeeRequest.builder()
                .shippingFee(BigDecimal.valueOf(25000))
                .build();

        ServiceWardResponse response = ServiceWardResponse.builder()
                .id(1)
                .wardName("Yên Lãng")
                .shippingFee(BigDecimal.valueOf(25000))
                .build();

        when(serviceWardService.updateShippingFee(eq(1), eq(BigDecimal.valueOf(25000))))
                .thenReturn(response);

        mockMvc.perform(put("/api/v1/admin/wards/1/shipping-fee")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.shippingFee", is(25000)));
    }

    @Test
    @DisplayName("Admin đổi trạng thái phục vụ phường thành công - 200 OK")
    void toggleActive_Success() throws Exception {
        ServiceWardResponse response = ServiceWardResponse.builder()
                .id(1)
                .isActive(false)
                .build();

        when(serviceWardService.toggleWardActive(1)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/admin/wards/1/toggle-active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.isActive", is(false)));
    }
}
