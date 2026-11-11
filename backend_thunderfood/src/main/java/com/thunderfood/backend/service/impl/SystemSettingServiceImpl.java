package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.dto.setting.SystemSettingResponse;
import com.thunderfood.backend.entity.SystemSetting;
import com.thunderfood.backend.repository.SystemSettingRepository;
import com.thunderfood.backend.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemSettingServiceImpl implements SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SystemSettingResponse> getAllSettings() {
        return systemSettingRepository.findAll()
                .stream()
                .map(SystemSettingResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> getSettingsMap() {
        return systemSettingRepository.findAll()
                .stream()
                .collect(Collectors.toMap(
                        SystemSetting::getSettingKey,
                        SystemSetting::getSettingValue,
                        (existing, replacement) -> replacement
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public String getSettingValue(String key, String defaultValue) {
        return systemSettingRepository.findBySettingKey(key)
                .map(SystemSetting::getSettingValue)
                .orElse(defaultValue);
    }

    @Override
    @Transactional
    public List<SystemSettingResponse> updateSettings(Map<String, String> settings) {
        if (settings == null || settings.isEmpty()) {
            return getAllSettings();
        }

        List<SystemSetting> toSave = new ArrayList<>();
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            String key = entry.getKey().trim();
            String value = entry.getValue() != null ? entry.getValue().trim() : "";

            SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                    .orElse(SystemSetting.builder()
                            .settingKey(key)
                            .settingValue(value)
                            .build());

            setting.setSettingValue(value);
            toSave.add(setting);
        }

        List<SystemSetting> saved = systemSettingRepository.saveAll(toSave);
        log.info("Admin đã cập nhật thành công {} cấu hình hệ thống", saved.size());

        return saved.stream()
                .map(SystemSettingResponse::fromEntity)
                .toList();
    }
}

