package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.banner.BannerResponse;
import com.thunderfood.backend.service.BannerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class BannerControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BannerService bannerService;

    @InjectMocks
    private BannerController bannerController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(bannerController).build();
    }

    @Test
    @DisplayName("Khách hàng lấy danh sách banner quảng cáo trang chủ - 200 OK")
    void getActiveBanners_Success() throws Exception {
        BannerResponse banner = BannerResponse.builder()
                .id(1L)
                .imageUrl("https://example.com/ad-banner.jpg")
                .sortOrder(1)
                .isActive(true)
                .build();

        when(bannerService.getActiveBanners()).thenReturn(List.of(banner));

        mockMvc.perform(get("/api/v1/banners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].imageUrl", is("https://example.com/ad-banner.jpg")))
                .andExpect(jsonPath("$.data[0].sortOrder", is(1)));
    }
}
