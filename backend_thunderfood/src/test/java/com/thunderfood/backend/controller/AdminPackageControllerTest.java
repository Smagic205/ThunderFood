package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.dto.admin.AdminPackageResponse;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.AdminPackageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminPackageControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AdminPackageService adminPackageService;

    @InjectMocks
    private AdminPackageController adminPackageController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminPackageController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Admin lấy danh sách gói hàng thành công - 200 OK")
    void testGetPackages_Success() throws Exception {
        AdminPackageResponse pkg = AdminPackageResponse.builder()
                .id(1L)
                .code("GOI-Q1-01")
                .status("UNASSIGNED")
                .orderCodes(List.of("ORD-1001", "ORD-1002"))
                .build();

        when(adminPackageService.getAllPackages(any(), any(), any())).thenReturn(List.of(pkg));

        mockMvc.perform(get("/api/v1/admin/packages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].code", is("GOI-Q1-01")));
    }

    @Test
    @DisplayName("Admin lọc gói hàng theo khoảng thời gian - 200 OK")
    void testGetPackages_WithDateRange() throws Exception {
        AdminPackageResponse pkg = AdminPackageResponse.builder()
                .id(2L)
                .code("GOI-Q1-02")
                .status("DELIVERING")
                .build();

        LocalDate startDate = LocalDate.of(2026, 11, 1);
        LocalDate endDate = LocalDate.of(2026, 11, 25);
        when(adminPackageService.getAllPackages(eq("DELIVERING"), eq(startDate), eq(endDate)))
                .thenReturn(List.of(pkg));

        mockMvc.perform(get("/api/v1/admin/packages")
                        .param("status", "DELIVERING")
                        .param("startDate", "2026-11-01")
                        .param("endDate", "2026-11-25"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data[0].code", is("GOI-Q1-02")));
    }

    @Test
    @DisplayName("Admin lấy chi tiết gói hàng theo code thành công - 200 OK")
    void testGetPackageByCode_Success() throws Exception {
        AdminPackageResponse pkg = AdminPackageResponse.builder()
                .id(1L)
                .code("GOI-Q1-01")
                .status("UNASSIGNED")
                .orderCodes(List.of("ORD-1001"))
                .build();

        when(adminPackageService.getPackageByCode("GOI-Q1-01")).thenReturn(pkg);

        mockMvc.perform(get("/api/v1/admin/packages/GOI-Q1-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.code", is("GOI-Q1-01")));
    }

    @Test
    @DisplayName("Admin gán nhân viên phụ trách gói hàng thành công - 200 OK")
    void testAssignStaff_Success() throws Exception {
        AdminPackageResponse pkg = AdminPackageResponse.builder()
                .id(1L)
                .code("GOI-Q1-01")
                .status("DELIVERING")
                .staffId(5L)
                .staffName("Nguyễn Văn Shipper")
                .build();

        when(adminPackageService.assignStaff(eq(1L), eq(5L))).thenReturn(pkg);

        mockMvc.perform(post("/api/v1/admin/packages/1/assign-staff?staffId=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("DELIVERING")));
    }

    @Test
    @DisplayName("Admin xóa gói hàng thành công - 200 OK")
    void testDeletePackage_Success() throws Exception {
        doNothing().when(adminPackageService).deletePackage(1L);

        mockMvc.perform(delete("/api/v1/admin/packages/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
