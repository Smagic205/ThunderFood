package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.dto.setting.SystemSettingResponse;
import com.thunderfood.backend.dto.setting.UpdateSystemSettingsRequest;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.SystemSettingService;
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
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminSettingControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SystemSettingService systemSettingService;

    @InjectMocks
    private AdminSettingController adminSettingController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminSettingController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Admin lấy toàn bộ cài đặt hệ thống thành công - 200 OK")
    void getAllSettings_Success() throws Exception {
        SystemSettingResponse s1 = SystemSettingResponse.builder()
                .id(1)
                .key("FREESHIP_THRESHOLD")
                .value("300000")
                .build();

        when(systemSettingService.getAllSettings()).thenReturn(List.of(s1));

        mockMvc.perform(get("/api/v1/admin/settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].key", is("FREESHIP_THRESHOLD")))
                .andExpect(jsonPath("$.data[0].value", is("300000")));
    }

    @Test
    @DisplayName("Admin cập nhật cài đặt hệ thống thành công - 200 OK")
    void updateSettings_Success() throws Exception {
        UpdateSystemSettingsRequest request = UpdateSystemSettingsRequest.builder()
                .settings(Map.of("FREESHIP_THRESHOLD", "350000", "MAX_ORDERS_PER_PACKAGE", "8"))
                .build();

        SystemSettingResponse s1 = SystemSettingResponse.builder()
                .id(1)
                .key("FREESHIP_THRESHOLD")
                .value("350000")
                .build();

        when(systemSettingService.updateSettings(anyMap())).thenReturn(List.of(s1));

        mockMvc.perform(put("/api/v1/admin/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data[0].value", is("350000")));
    }
}
