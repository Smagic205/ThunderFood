package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.ServiceWard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceWardRepository extends JpaRepository<ServiceWard, Integer>, JpaSpecificationExecutor<ServiceWard> {

    List<ServiceWard> findByIsActiveTrueOrderByWardNameAsc();

    List<ServiceWard> findByIsActiveTrueAndTypeIgnoreCaseOrderByWardNameAsc(String type);

    @Query("SELECT w FROM ServiceWard w WHERE w.isActive = true AND " +
           "(LOWER(w.wardName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(CONCAT(CASE WHEN UPPER(w.type) = 'PHUONG' THEN 'Phường ' ELSE 'Xã ' END, w.wardName)) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<ServiceWard> searchActiveWards(@Param("keyword") String keyword);

    Optional<ServiceWard> findByWardNameIgnoreCaseAndTypeIgnoreCase(String wardName, String type);

    Optional<ServiceWard> findFirstByWardNameIgnoreCase(String wardName);

    @Query("SELECT DISTINCT w.district FROM ServiceWard w WHERE w.isActive = true AND w.district IS NOT NULL ORDER BY w.district ASC")
    List<String> findDistinctDistricts();

    List<ServiceWard> findByDistrictIgnoreCaseAndIsActiveTrueOrderByWardNameAsc(String district);
}
