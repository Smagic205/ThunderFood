package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * Lọc đơn hàng 3 cấp cho màn hình đóng gói của nhân viên:
     *   1. districtId  – lọc theo quận (district của ward)
     *   2. wardId      – lọc theo phường cụ thể (ward_id FK)
     *   3. keyword     – tìm kiếm LIKE trong detail_address (số nhà / tên đường)
     *
     * Tất cả tham số đều nullable — nếu null thì bỏ qua điều kiện đó.
     * Chỉ lấy đơn có status = PENDING (chờ xác nhận/đóng gói).
     */
    @Query("""
            SELECT o FROM Order o
            JOIN o.address a
            JOIN a.ward w
            WHERE (:districtName IS NULL OR w.district = :districtName)
              AND (:wardId        IS NULL OR w.id = :wardId)
              AND (:keyword       IS NULL OR a.detailAddress LIKE %:keyword%)
              AND o.status = 'PENDING'
            ORDER BY o.createdAt DESC
            """)
    List<Order> filterPendingOrders(
            @Param("districtName") String districtName,
            @Param("wardId")       Integer wardId,
            @Param("keyword")      String keyword
    );

    /**
     * Lấy tất cả đơn thuộc 1 gói hàng.
     * Dùng để kiểm tra điều kiện hoàn thành gói (tất cả DELIVERED/CANCELLED).
     */
    @Query("SELECT o FROM Order o WHERE o.deliveryPackage.id = :packageId")
    List<Order> findByPackageId(@Param("packageId") Long packageId);

    /**
     * Đếm số đơn thuộc gói còn đang active (không phải DELIVERED/CANCELLED).
     * Khi kết quả = 0 thì gói được coi là hoàn thành.
     */
    @Query("""
            SELECT COUNT(o) FROM Order o
            WHERE o.deliveryPackage.id = :packageId
              AND o.status NOT IN ('DELIVERED', 'CANCELLED')
            """)
    long countActiveOrdersInPackage(@Param("packageId") Long packageId);
}
