package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.dto.banner.BannerResponse;
import com.thunderfood.backend.dto.banner.CreateBannerRequest;
import com.thunderfood.backend.dto.banner.UpdateBannerRequest;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.BannerService;
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
class AdminBannerControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BannerService bannerService;

    @InjectMocks
    private AdminBannerController adminBannerController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminBannerController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Admin lấy danh sách banner thành công - 200 OK")
    void getAllBanners_Success() throws Exception {
        BannerResponse banner = BannerResponse.builder()
                .id(1L)
                .imageUrl("https://res.cloudinary.com/banner1.jpg")
                .linkUrl("/promotions")
                .sortOrder(1)
                .isActive(true)
                .build();

        when(bannerService.getAllBannersForAdmin()).thenReturn(List.of(banner));

        mockMvc.perform(get("/api/v1/admin/banners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].imageUrl", is("https://res.cloudinary.com/banner1.jpg")));
    }

    @Test
    @DisplayName("Admin tạo banner mới thành công - 201 CREATED")
    void createBanner_Success() throws Exception {
        CreateBannerRequest request = CreateBannerRequest.builder()
                .imageUrl("https://res.cloudinary.com/banner1.jpg")
                .linkUrl("/promotions")
                .sortOrder(1)
                .isActive(true)
                .build();

        BannerResponse response = BannerResponse.builder()
                .id(1L)
                .imageUrl("https://res.cloudinary.com/banner1.jpg")
                .linkUrl("/promotions")
                .sortOrder(1)
                .isActive(true)
                .build();

        when(bannerService.createBanner(any(CreateBannerRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/admin/banners")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)));
    }

    @Test
    @DisplayName("Admin đổi trạng thái active banner thành công - 200 OK")
    void toggleActive_Success() throws Exception {
        BannerResponse response = BannerResponse.builder()
                .id(1L)
                .isActive(false)
                .build();

        when(bannerService.toggleBannerActive(1L)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/admin/banners/1/toggle-active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.isActive", is(false)));
    }

    @Test
    @DisplayName("Admin xóa banner thành công - 200 OK")
    void deleteBanner_Success() throws Exception {
        doNothing().when(bannerService).deleteBanner(1L);

        mockMvc.perform(delete("/api/v1/admin/banners/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}

