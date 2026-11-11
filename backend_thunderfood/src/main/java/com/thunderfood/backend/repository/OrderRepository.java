package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdWithLock(@Param("id") Long id);

    Optional<Order> findByOrderCode(String orderCode);

    Optional<Order> findByOrderCodeAndUserId(String orderCode, Long userId);

    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Order> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status, Pageable pageable);

    boolean existsByOrderCode(String orderCode);

    List<Order> findByDeliveryPackageId(Long packageId);

    List<Order> findByDeliveryPackageIdOrderByCreatedAtAsc(Long packageId);

    long countByDeliveryPackageId(Long packageId);

    // ── Queries phục vụ Dashboard & Báo cáo ──────────────────────────────────

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = 'DELIVERED' AND o.createdAt >= :start AND o.createdAt <= :end")
    BigDecimal calculateTotalRevenue(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT o.status, COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end GROUP BY o.status")
    List<Object[]> countOrdersByStatus(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end")
    long countTotalOrders(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    List<Order> findByStatusAndCreatedAtBetweenOrderByCreatedAtAsc(String status, LocalDateTime start, LocalDateTime end);

    List<Order> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);
}
