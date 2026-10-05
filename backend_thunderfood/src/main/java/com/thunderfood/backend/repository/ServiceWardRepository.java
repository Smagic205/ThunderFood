package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.ServiceWard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceWardRepository extends JpaRepository<ServiceWard, Integer> {

    /** Lấy danh sách quận/huyện phân biệt đang hoạt động — dùng cho combo box cấp 1. */
    @Query("SELECT DISTINCT sw.district FROM ServiceWard sw WHERE sw.isActive = true ORDER BY sw.district")
    List<String> findActiveDistricts();

    /** Lấy danh sách phường/xã theo quận đang hoạt động — dùng cho combo box cấp 2. */
    List<ServiceWard> findByDistrictAndIsActiveTrueOrderByWardNameAsc(String district);
}
