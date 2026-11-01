package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.dto.voucher.VoucherCheckRequest;
import com.thunderfood.backend.dto.voucher.VoucherCheckResponse;
import com.thunderfood.backend.dto.voucher.VoucherClientResponse;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.VoucherService;
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
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class VoucherControllerTest {

    private MockMvc mockMvc;

    @Mock
    private VoucherService voucherService;

    @InjectMocks
    private VoucherController voucherController;

    private ObjectMapper objectMapper;
    private VoucherClientResponse sampleClientResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(voucherController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        objectMapper = new ObjectMapper();

        sampleClientResponse = VoucherClientResponse.builder()
                .id(1L)
                .code("THUNDER20")
                .name("Giảm 20% đơn từ 100k")
                .description("Ưu đãi đặc biệt")
                .voucherType("PRODUCT")
                .discountType("PERCENT")
                .discountValue(new BigDecimal("20.00"))
                .minOrderAmount(new BigDecimal("100000.00"))
                .maxDiscountAmount(new BigDecimal("30000.00"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(5))
                .remainingUses(95)
                .eligible(true)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/vouchers/available trả về danh sách voucher khả dụng")
    void testGetAvailableVouchers() throws Exception {
        when(voucherService.getAvailableVouchersForCustomer(any(), any()))
                .thenReturn(List.of(sampleClientResponse));

        mockMvc.perform(get("/api/v1/vouchers/available")
                        .param("currentSubtotal", "150000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data[0].code", is("THUNDER20")))
                .andExpect(jsonPath("$.data[0].eligible", is(true)));
    }

    @Test
    @DisplayName("POST /api/v1/vouchers/check trả về thành công khi voucher hợp lệ")
    void testCheckVoucher_Valid() throws Exception {
        VoucherCheckRequest request = VoucherCheckRequest.builder()
                .code("THUNDER20")
                .subtotalAmount(new BigDecimal("200000.00"))
                .shippingFee(new BigDecimal("20000.00"))
                .build();

        VoucherCheckResponse response = VoucherCheckResponse.builder()
                .valid(true)
                .message("Áp dụng mã giảm giá thành công")
                .voucherType("PRODUCT")
                .discountAmount(new BigDecimal("30000.00"))
                .finalSubtotal(new BigDecimal("170000.00"))
                .finalShippingFee(new BigDecimal("20000.00"))
                .voucher(sampleClientResponse)
                .build();

        when(voucherService.checkVoucherEligibility(eq("THUNDER20"), any(), any(BigDecimal.class), any(BigDecimal.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/vouchers/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.valid", is(true)))
                .andExpect(jsonPath("$.data.discountAmount", is(30000.00)))
                .andExpect(jsonPath("$.data.finalSubtotal", is(170000.00)));
    }

    @Test
    @DisplayName("POST /api/v1/vouchers/check trả về lỗi logic khi voucher không hợp lệ")
    void testCheckVoucher_Invalid() throws Exception {
        VoucherCheckRequest request = VoucherCheckRequest.builder()
                .code("EXPIRED_CODE")
                .subtotalAmount(new BigDecimal("50000.00"))
                .shippingFee(new BigDecimal("20000.00"))
                .build();

        VoucherCheckResponse response = VoucherCheckResponse.builder()
                .valid(false)
                .message("Mã giảm giá đã hết hạn sử dụng")
                .voucherType("PRODUCT")
                .discountAmount(BigDecimal.ZERO)
                .finalSubtotal(new BigDecimal("50000.00"))
                .finalShippingFee(new BigDecimal("20000.00"))
                .build();

        when(voucherService.checkVoucherEligibility(eq("EXPIRED_CODE"), any(), any(BigDecimal.class), any(BigDecimal.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/vouchers/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Mã giảm giá đã hết hạn sử dụng")));
    }

    @Test
    @DisplayName("POST /api/v1/vouchers/check trả về 400 Bad Request khi mã code rỗng")
    void testCheckVoucher_BlankCode() throws Exception {
        VoucherCheckRequest request = VoucherCheckRequest.builder()
                .code("")
                .subtotalAmount(new BigDecimal("50000.00"))
                .shippingFee(new BigDecimal("20000.00"))
                .build();

        mockMvc.perform(post("/api/v1/vouchers/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
