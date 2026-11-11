package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    @Query("SELECT oi.product.id, oi.productName, p.category.name, SUM(oi.quantity), SUM(oi.lineTotal) " +
           "FROM OrderItem oi JOIN oi.order o LEFT JOIN oi.product p " +
           "WHERE o.status = 'DELIVERED' AND o.createdAt >= :start AND o.createdAt <= :end " +
           "GROUP BY oi.product.id, oi.productName, p.category.name " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingProducts(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, Pageable pageable);
}
