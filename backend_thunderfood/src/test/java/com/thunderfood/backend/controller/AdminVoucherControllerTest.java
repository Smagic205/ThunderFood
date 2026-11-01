package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.voucher.VoucherAdminResponse;
import com.thunderfood.backend.dto.voucher.VoucherRequest;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.service.VoucherService;
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
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminVoucherControllerTest {

    private MockMvc mockMvc;

    @Mock
    private VoucherService voucherService;

    @InjectMocks
    private AdminVoucherController adminVoucherController;

    private ObjectMapper objectMapper;
    private VoucherAdminResponse sampleResponse;
    private VoucherRequest sampleRequest;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminVoucherController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        now = LocalDateTime.now();

        sampleResponse = VoucherAdminResponse.builder()
                .id(1L)
                .code("THUNDER20")
                .name("Giảm 20% đơn từ 100k")
                .description("Mô tả ưu đãi")
                .voucherType("PRODUCT")
                .discountType("PERCENT")
                .discountValue(new BigDecimal("20.00"))
                .minOrderAmount(new BigDecimal("100000.00"))
                .maxDiscountAmount(new BigDecimal("30000.00"))
                .usageLimit(100)
                .usageLimitPerUser(1)
                .usedCount(5)
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(5))
                .isActive(true)
                .status("ACTIVE")
                .createdAt(now.minusDays(1))
                .updatedAt(now.minusDays(1))
                .build();

        sampleRequest = VoucherRequest.builder()
                .code("THUNDER20")
                .name("Giảm 20% đơn từ 100k")
                .description("Mô tả ưu đãi")
                .voucherType("PRODUCT")
                .discountType("PERCENT")
                .discountValue(new BigDecimal("20.00"))
                .minOrderAmount(new BigDecimal("100000.00"))
                .maxDiscountAmount(new BigDecimal("30000.00"))
                .usageLimit(100)
                .usageLimitPerUser(1)
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(5))
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/vouchers trả về danh sách voucher có phân trang")
    void testGetAllVouchers() throws Exception {
        PageResponse<VoucherAdminResponse> pageResponse = PageResponse.<VoucherAdminResponse>builder()
                .content(List.of(sampleResponse))
                .pagination(PaginationInfo.builder()
                        .page(0)
                        .size(10)
                        .totalElements(1)
                        .totalPages(1)
                        .hasNext(false)
                        .hasPrevious(false)
                        .build())
                .build();

        when(voucherService.getAllVouchersForAdmin(any(), any(), any(), any(Pageable.class))).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/admin/vouchers")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content[0].code", is("THUNDER20")))
                .andExpect(jsonPath("$.data.content[0].voucherType", is("PRODUCT")));
    }

    @Test
    @DisplayName("GET /api/v1/admin/vouchers/{id} trả về thông tin chi tiết voucher")
    void testGetVoucherById_Success() throws Exception {
        when(voucherService.getVoucherById(1L)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/admin/vouchers/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)))
                .andExpect(jsonPath("$.data.code", is("THUNDER20")));
    }

    @Test
    @DisplayName("GET /api/v1/admin/vouchers/{id} trả về 404 khi không tìm thấy")
    void testGetVoucherById_NotFound() throws Exception {
        when(voucherService.getVoucherById(999L))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy voucher"));

        mockMvc.perform(get("/api/v1/admin/vouchers/{id}", 999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("POST /api/v1/admin/vouchers trả về 201 Created khi tạo thành công")
    void testCreateVoucher_Success() throws Exception {
        when(voucherService.createVoucher(any(VoucherRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/admin/vouchers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.code", is("THUNDER20")));
    }

    @Test
    @DisplayName("POST /api/v1/admin/vouchers trả về 400 Bad Request khi dữ liệu không hợp lệ")
    void testCreateVoucher_ValidationError() throws Exception {
        sampleRequest.setCode(""); // Blank code

        mockMvc.perform(post("/api/v1/admin/vouchers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/vouchers/{id} trả về 200 khi cập nhật thành công")
    void testUpdateVoucher_Success() throws Exception {
        when(voucherService.updateVoucher(eq(1L), any(VoucherRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/v1/admin/vouchers/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)));
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/vouchers/{id}/toggle-status trả về 200")
    void testToggleStatus_Success() throws Exception {
        sampleResponse.setIsActive(false);
        when(voucherService.toggleVoucherStatus(1L)).thenReturn(sampleResponse);

        mockMvc.perform(patch("/api/v1/admin/vouchers/{id}/toggle-status", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.isActive", is(false)));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/vouchers/{id} trả về 200")
    void testDeleteVoucher_Success() throws Exception {
        doNothing().when(voucherService).deleteVoucher(1L);

        mockMvc.perform(delete("/api/v1/admin/vouchers/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
