package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.user.UpdateUserRoleRequest;
import com.thunderfood.backend.dto.user.UpdateUserStatusRequest;
import com.thunderfood.backend.dto.user.UserAdminResponse;
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
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private AdminUserController adminUserController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminUserController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();

        User mockAdmin = User.builder()
                .id(99L)
                .email("admin@thunderfood.vn")
                .role(Role.builder().id(1).name("ADMIN").build())
                .build();
        UserDetailsImpl userDetails = new UserDetailsImpl(mockAdmin);
        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Admin lấy danh sách người dùng thành công - 200 OK")
    void getAllUsers_Success() throws Exception {
        UserAdminResponse userDto = UserAdminResponse.builder()
                .id(1L)
                .fullName("Khách Hàng A")
                .email("userA@gmail.com")
                .role("CUSTOMER")
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();

        PageResponse<UserAdminResponse> pageResponse = PageResponse.<UserAdminResponse>builder()
                .content(List.of(userDto))
                .pagination(PaginationInfo.builder().page(0).size(10).totalElements(1).totalPages(1).build())
                .build();

        when(userService.getAllUsersForAdmin(any(), any(), any(), any(Pageable.class)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/admin/users")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].email", is("userA@gmail.com")));
    }

    @Test
    @DisplayName("Admin xem chi tiết người dùng thành công - 200 OK")
    void getUserDetail_Success() throws Exception {
        UserAdminResponse userDto = UserAdminResponse.builder()
                .id(1L)
                .fullName("Khách Hàng A")
                .email("userA@gmail.com")
                .role("CUSTOMER")
                .status("ACTIVE")
                .build();

        when(userService.getUserDetailForAdmin(1L)).thenReturn(userDto);

        mockMvc.perform(get("/api/v1/admin/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("userA@gmail.com")));
    }

    @Test
    @DisplayName("Admin khóa tài khoản người dùng thành công - 200 OK")
    void updateUserStatus_Success() throws Exception {
        UpdateUserStatusRequest request = UpdateUserStatusRequest.builder()
                .status("LOCKED")
                .build();

        UserAdminResponse userDto = UserAdminResponse.builder()
                .id(1L)
                .email("userA@gmail.com")
                .status("LOCKED")
                .build();

        when(userService.updateUserStatus(eq(1L), any(UpdateUserStatusRequest.class), eq(99L)))
                .thenReturn(userDto);

        mockMvc.perform(patch("/api/v1/admin/users/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("LOCKED")));
    }

    @Test
    @DisplayName("Admin phân quyền cho người dùng thành công - 200 OK")
    void updateUserRole_Success() throws Exception {
        UpdateUserRoleRequest request = UpdateUserRoleRequest.builder()
                .role("STAFF")
                .build();

        UserAdminResponse userDto = UserAdminResponse.builder()
                .id(1L)
                .email("userA@gmail.com")
                .role("STAFF")
                .build();

        when(userService.updateUserRole(eq(1L), any(UpdateUserRoleRequest.class), eq(99L)))
                .thenReturn(userDto);

        mockMvc.perform(patch("/api/v1/admin/users/1/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.role", is("STAFF")));
    }
}
