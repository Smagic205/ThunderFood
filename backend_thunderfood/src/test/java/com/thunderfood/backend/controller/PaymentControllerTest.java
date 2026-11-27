package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.payment.PaymentHistoryResponse;
import com.thunderfood.backend.dto.payment.PaymentStatusResponse;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.PaymentService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private PaymentController paymentController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(paymentController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        User u = User.builder().id(1L).email("u@tf.vn").role(Role.builder().id(1).name("CUSTOMER").build()).build();
        UserDetailsImpl details = new UserDetailsImpl(u);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /api/v1/payments/my giới hạn size tối đa 50 và GET /order/{orderId}/status trả về 200")
    void paymentControllerEndpoints() throws Exception {
        when(paymentService.getMyPayments(eq(1L), any(Pageable.class)))
                .thenReturn(PageResponse.<PaymentHistoryResponse>builder()
                        .content(List.of())
                        .pagination(PaginationInfo.builder().page(0).size(50).totalElements(0).totalPages(0).build())
                        .build());
        when(paymentService.getOrderPaymentStatus(1L, 10L))
                .thenReturn(PaymentStatusResponse.builder().orderId(10L).paymentStatus("PAID").build());

        mockMvc.perform(get("/api/v1/payments/my").param("size", "5000"))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(paymentService).getMyPayments(eq(1L), captor.capture());
        assertEquals(50, captor.getValue().getPageSize());

        mockMvc.perform(get("/api/v1/payments/order/10/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paymentStatus", is("PAID")));
    }
}
