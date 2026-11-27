package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.setting.SystemSettingResponse;
import com.thunderfood.backend.entity.SystemSetting;
import com.thunderfood.backend.repository.SystemSettingRepository;
import com.thunderfood.backend.service.impl.SystemSettingServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SystemSettingServiceImplTest {

    @Mock
    private SystemSettingRepository systemSettingRepository;

    @InjectMocks
    private SystemSettingServiceImpl systemSettingService;

    @Test
    @DisplayName("getSettingsMap và getSettingValue trả về đúng giá trị cấu hình hoặc fallback")
    void getSettingsAndFallback() {
        SystemSetting s = SystemSetting.builder().id(1).settingKey("FREE_SHIPPING_THRESHOLD").settingValue("200000").build();
        when(systemSettingRepository.findAll()).thenReturn(List.of(s));
        when(systemSettingRepository.findBySettingKey("FREE_SHIPPING_THRESHOLD")).thenReturn(Optional.of(s));
        when(systemSettingRepository.findBySettingKey("UNKNOWN")).thenReturn(Optional.empty());

        Map<String, String> map = systemSettingService.getSettingsMap();
        assertEquals("200000", map.get("FREE_SHIPPING_THRESHOLD"));
        assertEquals("200000", systemSettingService.getSettingValue("FREE_SHIPPING_THRESHOLD", "100000"));
        assertEquals("30", systemSettingService.getSettingValue("UNKNOWN", "30"));
    }

    @Test
    @DisplayName("updateSettings cập nhật và trả về danh sách SystemSettingResponse")
    void updateSettings_Success() {
        SystemSetting existing = SystemSetting.builder().id(1).settingKey("KEY_1").settingValue("old").build();
        when(systemSettingRepository.findBySettingKey("KEY_1")).thenReturn(Optional.of(existing));
        when(systemSettingRepository.findBySettingKey("KEY_2")).thenReturn(Optional.empty());
        when(systemSettingRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<SystemSettingResponse> updated = systemSettingService.updateSettings(Map.of("KEY_1", " new ", "KEY_2", "val2"));

        assertEquals(2, updated.size());
        verify(systemSettingRepository).saveAll(anyList());
    }
}
