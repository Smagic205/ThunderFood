package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.setting.SystemSettingResponse;

import java.util.List;
import java.util.Map;

public interface SystemSettingService {

    List<SystemSettingResponse> getAllSettings();

    Map<String, String> getSettingsMap();

    String getSettingValue(String key, String defaultValue);

    List<SystemSettingResponse> updateSettings(Map<String, String> settings);
}

