package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.address.AddressResponse;
import com.thunderfood.backend.dto.address.CreateAddressRequest;
import com.thunderfood.backend.dto.address.ServiceWardResponse;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.AddressService;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AddressControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private AddressService addressService;

    @InjectMocks
    private AddressController addressController;

    private User mockUser;
    private AddressResponse sampleAddress;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(addressController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mockUser = User.builder()
                .id(1L)
                .fullName("Nguyễn Văn A")
                .email("user@gmail.com")
                .role(Role.builder().id(1).name("CUSTOMER").build())
                .build();

        sampleAddress = AddressResponse.builder()
                .id(10L)
                .userId(1L)
                .receiverName("Nguyễn Văn A")
                .phone("0987654321")
                .detailAddress("Số 10, Ngõ 5")
                .wardName("Yên Lãng")
                .wardType("PHUONG")
                .fullAddress("Số 10, Ngõ 5, Phường Yên Lãng")
                .shippingFee(BigDecimal.valueOf(15000))
                .isDefault(true)
                .build();

        // Giả lập user đã đăng nhập qua SecurityContextHolder
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
    @DisplayName("GET /api/v1/addresses/wards trả về danh sách phường xã phục vụ")
    void testGetServiceWards_Success() throws Exception {
        ServiceWardResponse ward1 = ServiceWardResponse.builder()
                .id(1)
                .wardName("Yên Lãng")
                .wardType("PHUONG")
                .shippingFee(BigDecimal.valueOf(15000))
                .build();

        when(addressService.getActiveWards(any(), any())).thenReturn(List.of(ward1));

        mockMvc.perform(get("/api/v1/addresses/wards"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].wardName", is("Yên Lãng")));
    }

    @Test
    @DisplayName("POST /api/v1/addresses tạo địa chỉ mới thành công trả về 201 Created")
    void testCreateAddress_Success() throws Exception {
        CreateAddressRequest request = CreateAddressRequest.builder()
                .detailAddress("Số 10, Ngõ 5")
                .wardName("Yên Lãng")
                .wardType("PHUONG")
                .receiverName("Nguyễn Văn A")
                .phone("0987654321")
                .isDefault(true)
                .build();

        when(addressService.createAddress(eq(1L), any(CreateAddressRequest.class))).thenReturn(sampleAddress);

        mockMvc.perform(post("/api/v1/addresses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(10)))
                .andExpect(jsonPath("$.data.fullAddress", is("Số 10, Ngõ 5, Phường Yên Lãng")));
    }

    @Test
    @DisplayName("POST /api/v1/addresses trả về 400 khi địa chỉ chi tiết bị để trống")
    void testCreateAddress_BlankDetail_ReturnsBadRequest() throws Exception {
        CreateAddressRequest request = CreateAddressRequest.builder()
                .detailAddress("")
                .build();

        mockMvc.perform(post("/api/v1/addresses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        verify(addressService, never()).createAddress(any(), any());
    }

    @Test
    @DisplayName("GET /api/v1/addresses trả về danh sách địa chỉ của người dùng")
    void testGetMyAddresses_Success() throws Exception {
        when(addressService.getUserAddresses(1L)).thenReturn(List.of(sampleAddress));

        mockMvc.perform(get("/api/v1/addresses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].receiverName", is("Nguyễn Văn A")));
    }

    @Test
    @DisplayName("GET /api/v1/addresses/default trả về địa chỉ mặc định")
    void testGetDefaultAddress_Success() throws Exception {
        when(addressService.getDefaultAddress(1L)).thenReturn(sampleAddress);

        mockMvc.perform(get("/api/v1/addresses/default"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.isDefault", is(true)));
    }

    @Test
    @DisplayName("PATCH /api/v1/addresses/{id}/default đặt địa chỉ làm mặc định")
    void testSetDefaultAddress_Success() throws Exception {
        when(addressService.setDefaultAddress(10L, 1L)).thenReturn(sampleAddress);

        mockMvc.perform(patch("/api/v1/addresses/10/default"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Đặt làm địa chỉ mặc định thành công")));
    }

    @Test
    @DisplayName("DELETE /api/v1/addresses/{id} xóa địa chỉ thành công")
    void testDeleteAddress_Success() throws Exception {
        doNothing().when(addressService).deleteAddress(10L, 1L);

        mockMvc.perform(delete("/api/v1/addresses/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Xóa địa chỉ thành công")));
    }
}
