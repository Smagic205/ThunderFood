package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, Integer> {
    Optional<SystemSetting> findBySettingKey(String settingKey);
    List<SystemSetting> findBySettingKeyIn(Collection<String> settingKeys);
    boolean existsBySettingKey(String settingKey);
}
