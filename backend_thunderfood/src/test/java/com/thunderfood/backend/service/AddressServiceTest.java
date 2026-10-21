package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.address.AddressResponse;
import com.thunderfood.backend.dto.address.CreateAddressRequest;
import com.thunderfood.backend.dto.address.ServiceWardResponse;
import com.thunderfood.backend.entity.Address;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.ServiceWard;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.AddressRepository;
import com.thunderfood.backend.repository.ServiceWardRepository;
import com.thunderfood.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AddressServiceTest {

    @Mock
    private ServiceWardRepository serviceWardRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AddressService addressService;

    private User mockUser;
    private ServiceWard mockWardPhuong;
    private ServiceWard mockWardXa;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(1L)
                .fullName("Nguyễn Văn A")
                .email("khachhang@gmail.com")
                .phone("0987654321")
                .role(Role.builder().id(1).name("CUSTOMER").build())
                .status("ACTIVE")
                .build();

        mockWardPhuong = ServiceWard.builder()
                .id(1)
                .wardName("Yên Lãng")
                .type("PHUONG")
                .shippingFee(new BigDecimal("20000.00"))
                .isActive(true)
                .build();

        mockWardXa = ServiceWard.builder()
                .id(2)
                .wardName("Trung Tự")
                .type("PHUONG")
                .shippingFee(new BigDecimal("22000.00"))
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Lấy danh sách phường/xã đang phục vụ - Trả về đầy đủ thông tin tên và kiểu")
    void getActiveWards_All() {
        when(serviceWardRepository.findByIsActiveTrueOrderByWardNameAsc())
                .thenReturn(List.of(mockWardPhuong, mockWardXa));

        List<ServiceWardResponse> result = addressService.getActiveWards(null, null);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Yên Lãng", result.get(0).getWardName());
        assertEquals("PHUONG", result.get(0).getType());
        assertEquals("Phường Yên Lãng", result.get(0).getDisplayName());
        assertEquals(new BigDecimal("20000.00"), result.get(0).getShippingFee());
    }

    @Test
    @DisplayName("Tìm kiếm phường/xã theo từ khóa tên")
    void getActiveWards_SearchKeyword() {
        when(serviceWardRepository.searchActiveWards("Yên Lãng"))
                .thenReturn(List.of(mockWardPhuong));

        List<ServiceWardResponse> result = addressService.getActiveWards("Yên Lãng", null);

        assertEquals(1, result.size());
        assertEquals("Yên Lãng", result.get(0).getWardName());
        verify(serviceWardRepository, times(1)).searchActiveWards("Yên Lãng");
    }

    @Test
    @DisplayName("Lưu địa chỉ nhận hàng thành công khi gửi tên phường và kiểu (xã/phường) kèm địa chỉ nhà")
    void createAddress_WithWardNameAndType() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(serviceWardRepository.findByWardNameIgnoreCaseAndTypeIgnoreCase("Yên Lãng", "PHUONG"))
                .thenReturn(Optional.of(mockWardPhuong));
        when(addressRepository.existsByUserId(1L)).thenReturn(false);
        when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> {
            Address a = invocation.getArgument(0);
            a.setId(10L);
            a.setCreatedAt(LocalDateTime.now());
            return a;
        });

        CreateAddressRequest request = CreateAddressRequest.builder()
                .wardName("Yên Lãng")
                .wardType("PHUONG")
                .detailAddress("Số 120, Ngõ 5")
                .receiverName("Nguyễn Văn A")
                .phone("0987654321")
                .build();

        AddressResponse response = addressService.createAddress(1L, request);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Số 120, Ngõ 5", response.getDetailAddress());
        assertNotNull(response.getWard());
        assertEquals("Yên Lãng", response.getWard().getWardName());
        assertEquals("PHUONG", response.getWard().getType());
        assertEquals("Số 120, Ngõ 5, Phường Yên Lãng, Hà Nội", response.getFullAddress());
        assertTrue(response.getIsDefault()); // Địa chỉ đầu tiên tự động thành mặc định

        verify(addressRepository, times(1)).save(any(Address.class));
    }

    @Test
    @DisplayName("Lưu địa chỉ nhận hàng thành công khi gửi wardId kèm địa chỉ nhà")
    void createAddress_WithWardId() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(serviceWardRepository.findById(1)).thenReturn(Optional.of(mockWardPhuong));
        when(addressRepository.existsByUserId(1L)).thenReturn(true);
        when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> {
            Address a = invocation.getArgument(0);
            a.setId(11L);
            a.setCreatedAt(LocalDateTime.now());
            return a;
        });

        CreateAddressRequest request = CreateAddressRequest.builder()
                .wardId(1)
                .detailAddress("Căn hộ 302, Chung cư Sunrise")
                .isDefault(false)
                .build();

        AddressResponse response = addressService.createAddress(1L, request);

        assertNotNull(response);
        assertEquals(11L, response.getId());
        assertEquals("Nguyễn Văn A", response.getReceiverName()); // Tự động lấy tên tài khoản
        assertEquals("0987654321", response.getPhone());         // Tự động lấy SĐT tài khoản
        assertEquals("Căn hộ 302, Chung cư Sunrise", response.getDetailAddress());
        assertFalse(response.getIsDefault());
    }

    @Test
    @DisplayName("Lưu địa chỉ thất bại khi không tìm thấy phường/xã")
    void createAddress_WardNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(serviceWardRepository.findByWardNameIgnoreCaseAndTypeIgnoreCase("Không Tồn Tại", "PHUONG"))
                .thenReturn(Optional.empty());
        when(serviceWardRepository.findFirstByWardNameIgnoreCase("Không Tồn Tại"))
                .thenReturn(Optional.empty());

        CreateAddressRequest request = CreateAddressRequest.builder()
                .wardName("Không Tồn Tại")
                .wardType("PHUONG")
                .detailAddress("Số 10")
                .build();

        assertThrows(ResourceNotFoundException.class, () -> addressService.createAddress(1L, request));
        verify(addressRepository, never()).save(any());
    }

    @Test
    @DisplayName("Lấy danh sách địa chỉ nhận hàng của user")
    void getUserAddresses_Success() {
        Address addr = Address.builder()
                .id(1L)
                .user(mockUser)
                .ward(mockWardPhuong)
                .receiverName("Nguyễn Văn A")
                .phone("0987654321")
                .detailAddress("Số 120 Yên Lãng")
                .isDefault(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(1L))
                .thenReturn(List.of(addr));

        List<AddressResponse> addresses = addressService.getUserAddresses(1L);

        assertEquals(1, addresses.size());
        assertEquals("Số 120 Yên Lãng, Phường Yên Lãng, Hà Nội", addresses.get(0).getFullAddress());
    }

    @Test
    @DisplayName("Lấy địa chỉ mặc định của user thành công")
    void getDefaultAddress_Success() {
        Address addr = Address.builder()
                .id(1L)
                .user(mockUser)
                .ward(mockWardPhuong)
                .receiverName("Nguyễn Văn A")
                .phone("0987654321")
                .detailAddress("Số 120 Yên Lãng")
                .isDefault(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(addressRepository.findByUserIdAndIsDefaultTrue(1L))
                .thenReturn(Optional.of(addr));

        AddressResponse defaultAddress = addressService.getDefaultAddress(1L);

        assertNotNull(defaultAddress);
        assertEquals("Số 120 Yên Lãng, Phường Yên Lãng, Hà Nội", defaultAddress.getFullAddress());
        assertTrue(defaultAddress.getIsDefault());
    }

    @Test
    @DisplayName("Lấy địa chỉ mặc định khi user chưa có địa chỉ nào -> trả về null")
    void getDefaultAddress_NullWhenNoAddress() {
        when(addressRepository.findByUserIdAndIsDefaultTrue(1L))
                .thenReturn(Optional.empty());
        when(addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(1L))
                .thenReturn(List.of());

        AddressResponse defaultAddress = addressService.getDefaultAddress(1L);

        assertNull(defaultAddress);
    }
}
