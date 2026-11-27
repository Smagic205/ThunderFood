package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.address.ServiceWardResponse;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.entity.ServiceWard;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.ServiceWardRepository;
import com.thunderfood.backend.service.impl.ServiceWardServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceWardServiceImplTest {

    @Mock
    private ServiceWardRepository serviceWardRepository;

    @InjectMocks
    private ServiceWardServiceImpl serviceWardService;

    @Test
    @DisplayName("getAllWardsForAdmin trả về danh sách phường có phân trang")
    @SuppressWarnings("unchecked")
    void getAllWardsForAdmin_Success() {
        ServiceWard ward = ServiceWard.builder().id(1).district("Đống Đa").wardName("Kim Liên").shippingFee(new BigDecimal("20000")).isActive(true).build();
        when(serviceWardRepository.findAll(any(Specification.class), eq(PageRequest.of(0, 10))))
                .thenReturn(new PageImpl<>(List.of(ward)));

        PageResponse<ServiceWardResponse> resp = serviceWardService.getAllWardsForAdmin("Đống Đa", "Kim", true, PageRequest.of(0, 10));
        assertEquals(1, resp.getContent().size());
        assertEquals("Kim Liên", resp.getContent().get(0).getWardName());
    }

    @Test
    @DisplayName("updateShippingFee từ chối phí âm và cập nhật hợp lệ khi >= 0")
    void updateShippingFee_ValidationAndSuccess() {
        assertThrows(IllegalArgumentException.class, () -> serviceWardService.updateShippingFee(1, new BigDecimal("-1")));

        when(serviceWardRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> serviceWardService.updateShippingFee(99, BigDecimal.TEN));

        ServiceWard ward = ServiceWard.builder().id(1).wardName("Trung Tự").shippingFee(new BigDecimal("20000")).isActive(true).build();
        when(serviceWardRepository.findById(1)).thenReturn(Optional.of(ward));
        when(serviceWardRepository.save(any(ServiceWard.class))).thenAnswer(inv -> inv.getArgument(0));

        ServiceWardResponse updated = serviceWardService.updateShippingFee(1, new BigDecimal("25000"));
        assertEquals(new BigDecimal("25000"), updated.getShippingFee());
    }
}
