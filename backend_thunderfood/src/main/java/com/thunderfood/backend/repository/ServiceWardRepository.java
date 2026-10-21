package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.ServiceWard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceWardRepository extends JpaRepository<ServiceWard, Integer> {

    /**
     * Lấy danh sách tất cả phường/xã đang phục vụ giao hàng (isActive = true), sắp xếp A-Z theo tên
     */
    List<ServiceWard> findByIsActiveTrueOrderByWardNameAsc();

    /**
     * Lấy danh sách phường/xã theo kiểu (PHUONG hoặc XA) đang hoạt động
     */
    List<ServiceWard> findByIsActiveTrueAndTypeIgnoreCaseOrderByWardNameAsc(String type);

    /**
     * Tìm kiếm phường/xã đang hoạt động theo từ khóa tên hoặc tên kèm tiền tố ("Phường...", "Xã...")
     */
    @Query("SELECT w FROM ServiceWard w WHERE w.isActive = true AND " +
           "(LOWER(w.wardName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(CONCAT(CASE WHEN UPPER(w.type) = 'PHUONG' THEN 'Phường ' ELSE 'Xã ' END, w.wardName)) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<ServiceWard> searchActiveWards(@Param("keyword") String keyword);

    /**
     * Tìm kiếm phường/xã theo tên và kiểu (PHUONG / XA)
     */
    Optional<ServiceWard> findByWardNameIgnoreCaseAndTypeIgnoreCase(String wardName, String type);

    /**
     * Tìm phường/xã đầu tiên theo tên
     */
    Optional<ServiceWard> findFirstByWardNameIgnoreCase(String wardName);
}
