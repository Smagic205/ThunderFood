package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.DeliveryPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryPackageRepository extends JpaRepository<DeliveryPackage, Long> {

    /** Tìm gói theo tên (nhân viên nhập khi xác nhận đơn). */
    Optional<DeliveryPackage> findByPackageName(String packageName);

    /** Lấy tất cả gói chưa có nhân viên nhận giao (status = PENDING). */
    List<DeliveryPackage> findByStatusOrderByCreatedAtDesc(String status);

    /**
     * Đếm số đơn hiện tại trong gói — dùng để kiểm tra có vượt max_orders không
     * trước khi thêm đơn mới vào.
     */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.deliveryPackage.id = :packageId")
    int countOrdersInPackage(@Param("packageId") Long packageId);

    /**
     * Gói đơn hiện tại của nhân viên đang trong trạng thái DELIVERING
     * (mỗi nhân viên chỉ được nhận 1 gói tại 1 thời điểm).
     */
    @Query("SELECT dp FROM DeliveryPackage dp WHERE dp.shippedByStaff.id = :staffId AND dp.status = 'DELIVERING'")
    Optional<DeliveryPackage> findActivePackageByStaff(@Param("staffId") Long staffId);
}
