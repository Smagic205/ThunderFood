package com.thunderfood.backend.dto.setting;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSystemSettingsRequest {

    @NotEmpty(message = "Danh sách cài đặt không được để trống")
    private Map<String, String> settings;
}

