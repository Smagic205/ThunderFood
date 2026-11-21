package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.banner.BannerResponse;
import com.thunderfood.backend.dto.banner.CreateBannerRequest;
import com.thunderfood.backend.dto.banner.UpdateBannerRequest;
import com.thunderfood.backend.entity.Banner;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.BannerRepository;
import com.thunderfood.backend.service.impl.BannerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BannerServiceTest {

    @Mock
    private BannerRepository bannerRepository;

    @InjectMocks
    private BannerServiceImpl bannerService;

    private Banner banner1;
    private Banner banner2;

    @BeforeEach
    void setUp() {
        banner1 = Banner.builder()
                .id(1L)
                .imageUrl("https://example.com/banner1.jpg")
                .linkUrl(null)
                .sortOrder(1)
                .isActive(true)
                .build();

        banner2 = Banner.builder()
                .id(2L)
                .imageUrl("https://example.com/banner2.jpg")
                .linkUrl(null)
                .sortOrder(2)
                .isActive(false)
                .build();
    }

    @Test
    @DisplayName("Lấy danh sách banner đang hoạt động hiển thị trang chủ")
    void getActiveBanners_Success() {
        when(bannerRepository.findByIsActiveTrueOrderBySortOrderAsc()).thenReturn(List.of(banner1));

        List<BannerResponse> result = bannerService.getActiveBanners();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
        assertTrue(result.get(0).getIsActive());
        verify(bannerRepository).findByIsActiveTrueOrderBySortOrderAsc();
    }

    @Test
    @DisplayName("Admin lấy toàn bộ danh sách banner (kể cả đang tắt)")
    void getAllBannersForAdmin_Success() {
        when(bannerRepository.findAllByOrderBySortOrderAsc()).thenReturn(List.of(banner1, banner2));

        List<BannerResponse> result = bannerService.getAllBannersForAdmin();

        assertNotNull(result);
        assertEquals(2, result.size());
        verify(bannerRepository).findAllByOrderBySortOrderAsc();
    }

    @Test
    @DisplayName("Admin lấy chi tiết một banner theo ID thành công")
    void getBannerById_Success() {
        when(bannerRepository.findById(1L)).thenReturn(Optional.of(banner1));

        BannerResponse result = bannerService.getBannerById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("https://example.com/banner1.jpg", result.getImageUrl());
    }

    @Test
    @DisplayName("Admin lấy banner theo ID không tồn tại ném ngoại lệ ResourceNotFoundException")
    void getBannerById_NotFound() {
        when(bannerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> bannerService.getBannerById(99L));
    }

    @Test
    @DisplayName("Admin tạo mới banner quảng cáo thành công")
    void createBanner_Success() {
        CreateBannerRequest request = CreateBannerRequest.builder()
                .imageUrl("https://example.com/new-banner.jpg")
                .sortOrder(5)
                .isActive(true)
                .build();

        when(bannerRepository.save(any(Banner.class))).thenAnswer(inv -> {
            Banner b = inv.getArgument(0);
            b.setId(10L);
            return b;
        });

        BannerResponse result = bannerService.createBanner(request);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("https://example.com/new-banner.jpg", result.getImageUrl());
        assertEquals(5, result.getSortOrder());
        assertTrue(result.getIsActive());
        verify(bannerRepository).save(any(Banner.class));
    }

    @Test
    @DisplayName("Admin cập nhật banner thành công")
    void updateBanner_Success() {
        UpdateBannerRequest request = UpdateBannerRequest.builder()
                .imageUrl("https://example.com/updated-banner.jpg")
                .sortOrder(3)
                .isActive(false)
                .build();

        when(bannerRepository.findById(1L)).thenReturn(Optional.of(banner1));
        when(bannerRepository.save(any(Banner.class))).thenAnswer(inv -> inv.getArgument(0));

        BannerResponse result = bannerService.updateBanner(1L, request);

        assertNotNull(result);
        assertEquals("https://example.com/updated-banner.jpg", result.getImageUrl());
        assertEquals(3, result.getSortOrder());
        assertFalse(result.getIsActive());
    }

    @Test
    @DisplayName("Admin đổi trạng thái active banner thành công")
    void toggleBannerActive_Success() {
        when(bannerRepository.findById(1L)).thenReturn(Optional.of(banner1));
        when(bannerRepository.save(any(Banner.class))).thenAnswer(inv -> inv.getArgument(0));

        BannerResponse result = bannerService.toggleBannerActive(1L);

        assertNotNull(result);
        assertFalse(result.getIsActive()); // Ban đầu true -> đổi thành false
    }

    @Test
    @DisplayName("Admin xóa banner thành công")
    void deleteBanner_Success() {
        when(bannerRepository.findById(1L)).thenReturn(Optional.of(banner1));
        doNothing().when(bannerRepository).delete(banner1);

        assertDoesNotThrow(() -> bannerService.deleteBanner(1L));
        verify(bannerRepository).delete(banner1);
    }

    @Test
    @DisplayName("Admin xóa banner không tồn tại ném ResourceNotFoundException")
    void deleteBanner_NotFound() {
        when(bannerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> bannerService.deleteBanner(99L));
    }
}
