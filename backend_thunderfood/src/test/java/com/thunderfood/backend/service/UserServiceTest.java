package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.user.CustomerProfileResponse;
import com.thunderfood.backend.dto.user.UpdateCustomerProfileRequest;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User mockUser;
    private Role customerRole;

    @BeforeEach
    void setUp() {
        customerRole = Role.builder()
                .id(1)
                .name("CUSTOMER")
                .build();

        mockUser = User.builder()
                .id(1L)
                .fullName("Nguyễn Văn A")
                .email("khachhang@gmail.com")
                .phone("0987654321")
                .avatarUrl("https://example.com/avatar.jpg")
                .role(customerRole)
                .authProvider("LOCAL")
                .status("ACTIVE")
                .createdAt(LocalDateTime.now().minusDays(10))
                .updatedAt(LocalDateTime.now().minusDays(1))
                .build();
    }

    @Test
    @DisplayName("Lấy thông tin khách hàng thành công - Trả về đầy đủ email, tên, số điện thoại")
    void getCustomerProfile_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));

        CustomerProfileResponse response = userService.getCustomerProfile(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("khachhang@gmail.com", response.getEmail());
        assertEquals("Nguyễn Văn A", response.getFullName());
        assertEquals("0987654321", response.getPhone());
        assertEquals("CUSTOMER", response.getRole());
        verify(userRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Lấy thông tin khách hàng thất bại khi không tìm thấy ID")
    void getCustomerProfile_NotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getCustomerProfile(99L));
        verify(userRepository, times(1)).findById(99L);
    }

    @Test
    @DisplayName("Cập nhật thông tin khách hàng thành công - Email không đổi và được trả về trong response")
    void updateCustomerProfile_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateCustomerProfileRequest request = UpdateCustomerProfileRequest.builder()
                .fullName("Nguyễn Văn B (Mới)")
                .phone("0912345678")
                .avatarUrl("https://example.com/new-avatar.jpg")
                .build();

        CustomerProfileResponse response = userService.updateCustomerProfile(1L, request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        // Tên và SĐT đã được cập nhật
        assertEquals("Nguyễn Văn B (Mới)", response.getFullName());
        assertEquals("0912345678", response.getPhone());
        assertEquals("https://example.com/new-avatar.jpg", response.getAvatarUrl());

        // Email giữ nguyên không đổi và được trả về trong response
        assertEquals("khachhang@gmail.com", response.getEmail());
        assertEquals("khachhang@gmail.com", mockUser.getEmail());

        verify(userRepository, times(1)).findById(1L);
        verify(userRepository, times(1)).save(mockUser);
    }

    @Test
    @DisplayName("Cập nhật thông tin khách hàng thất bại khi không tìm thấy user")
    void updateCustomerProfile_NotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        UpdateCustomerProfileRequest request = UpdateCustomerProfileRequest.builder()
                .fullName("Ai Đó")
                .phone("0987654321")
                .build();

        assertThrows(ResourceNotFoundException.class, () -> userService.updateCustomerProfile(999L, request));
        verify(userRepository, times(1)).findById(999L);
        verify(userRepository, never()).save(any());
    }
}
