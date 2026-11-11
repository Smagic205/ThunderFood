package com.thunderfood.backend.dto.setting;

import com.thunderfood.backend.entity.SystemSetting;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSettingResponse {
    private Integer id;
    private String key;
    private String value;

    public static SystemSettingResponse fromEntity(SystemSetting setting) {
        return SystemSettingResponse.builder()
                .id(setting.getId())
                .key(setting.getSettingKey())
                .value(setting.getSettingValue())
                .build();
    }
}

