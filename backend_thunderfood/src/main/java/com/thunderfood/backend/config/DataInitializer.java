package com.thunderfood.backend.config;

import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.SystemSetting;
import com.thunderfood.backend.repository.RoleRepository;
import com.thunderfood.backend.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Tự động seed dữ liệu mặc định khi app khởi động lần đầu.
 * Chỉ insert nếu chưa tồn tại → an toàn khi restart.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final SystemSettingRepository systemSettingRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedRoles();
        seedSystemSettings();
    }

    private void seedRoles() {
        List<String> defaultRoles = List.of("ADMIN", "STAFF", "CUSTOMER");
        for (String roleName : defaultRoles) {
            if (!roleRepository.existsByName(roleName)) {
                roleRepository.save(Role.builder().name(roleName).build());
                log.info("Đã tạo role: {}", roleName);
            }
        }
    }

    private void seedSystemSettings() {
        insertSettingIfAbsent("DEFAULT_SHIPPING_FEE", "15000");
        insertSettingIfAbsent("FREE_SHIPPING_THRESHOLD", "200000");
    }

    private void insertSettingIfAbsent(String key, String value) {
        if (!systemSettingRepository.existsBySettingKey(key)) {
            systemSettingRepository.save(
                SystemSetting.builder()
                    .settingKey(key)
                    .settingValue(value)
                    .build()
            );
            log.info("Đã tạo system setting: {} = {}", key, value);
        }
    }
}
