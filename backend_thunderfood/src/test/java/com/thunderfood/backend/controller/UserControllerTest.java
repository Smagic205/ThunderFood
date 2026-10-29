package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.user.CustomerProfileResponse;
import com.thunderfood.backend.dto.user.UpdateCustomerProfileRequest;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.UserService;
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
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private User mockUser;
    private CustomerProfileResponse sampleProfile;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();

        mockUser = User.builder()
                .id(1L)
                .fullName("Nguyễn Văn A")
                .email("user@gmail.com")
                .phone("0987654321")
                .role(Role.builder().id(1).name("CUSTOMER").build())
                .status("ACTIVE")
                .build();

        sampleProfile = CustomerProfileResponse.builder()
                .id(1L)
                .fullName("Nguyễn Văn A")
                .email("user@gmail.com")
                .phone("0987654321")
                .role("CUSTOMER")
                .status("ACTIVE")
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
    @DisplayName("GET /api/v1/users/profile trả về thông tin profile khách hàng đang đăng nhập")
    void testGetProfile_Success() throws Exception {
        when(userService.getCustomerProfile(1L)).thenReturn(sampleProfile);

        mockMvc.perform(get("/api/v1/users/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)))
                .andExpect(jsonPath("$.data.email", is("user@gmail.com")))
                .andExpect(jsonPath("$.data.fullName", is("Nguyễn Văn A")));
    }

    @Test
    @DisplayName("PUT /api/v1/users/profile cập nhật profile thành công")
    void testUpdateProfile_Success() throws Exception {
        UpdateCustomerProfileRequest request = new UpdateCustomerProfileRequest();
        request.setFullName("Nguyễn Văn B");
        request.setPhone("0912345678");

        CustomerProfileResponse updatedProfile = CustomerProfileResponse.builder()
                .id(1L)
                .fullName("Nguyễn Văn B")
                .email("user@gmail.com")
                .phone("0912345678")
                .build();

        when(userService.updateCustomerProfile(eq(1L), any(UpdateCustomerProfileRequest.class)))
                .thenReturn(updatedProfile);

        mockMvc.perform(put("/api/v1/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.fullName", is("Nguyễn Văn B")))
                .andExpect(jsonPath("$.data.phone", is("0912345678")));
    }

    @Test
    @DisplayName("GET /api/v1/users/{id} trả về thông tin khi truy cập chính mình")
    void testGetCustomerById_SameUser_Success() throws Exception {
        when(userService.getCustomerProfile(1L)).thenReturn(sampleProfile);

        mockMvc.perform(get("/api/v1/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("user@gmail.com")));
    }

    @Test
    @DisplayName("GET /api/v1/users/{id} ném ngoại lệ khi user thường cố tình xem profile người khác")
    void testGetCustomerById_OtherUser_ThrowsForbidden() throws Exception {
        // User hiện tại là id=1, cố tình request id=2
        mockMvc.perform(get("/api/v1/users/2"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Bạn không có quyền truy cập hoặc chỉnh sửa thông tin của người dùng khác")));

        verify(userService, never()).getCustomerProfile(2L);
    }
}
