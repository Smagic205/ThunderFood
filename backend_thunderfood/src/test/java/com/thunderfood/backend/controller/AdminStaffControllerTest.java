package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.dto.auth.RegisterRequest;
import com.thunderfood.backend.dto.staff.StaffAccountResponse;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.UserService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminStaffControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private AdminStaffController adminStaffController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminStaffController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Admin tạo tài khoản Staff thành công - Trả về 201 CREATED")
    void createStaff_Success() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Nguyễn Văn Shipper",
                "shipper@thunderfood.vn",
                "Password123@",
                "0988776655"
        );

        StaffAccountResponse response = StaffAccountResponse.builder()
                .id(10L)
                .fullName("Nguyễn Văn Shipper")
                .email("shipper@thunderfood.vn")
                .phone("0988776655")
                .role("STAFF")
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();

        when(userService.createStaffAccount(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/admin/staffs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("shipper@thunderfood.vn")))
                .andExpect(jsonPath("$.data.role", is("STAFF")));
    }

    @Test
    @DisplayName("Admin xem danh sách Staff thành công - Trả về 200 OK")
    void getAllStaffs_Success() throws Exception {
        StaffAccountResponse staff1 = StaffAccountResponse.builder()
                .id(1L)
                .email("staff1@thunderfood.vn")
                .fullName("Nhân Viên 1")
                .role("STAFF")
                .build();

        when(userService.getAllStaffs()).thenReturn(List.of(staff1));

        mockMvc.perform(get("/api/v1/admin/staffs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].email", is("staff1@thunderfood.vn")));
    }
}
