package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByIdAndIsAvailableTrue(Long id);

    Optional<Product> findBySlugAndIsAvailableTrue(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    /**
     * Lấy sản phẩm kèm khóa FOR UPDATE để tránh race condition
     * khi nhiều đơn hàng cùng trừ tồn kho của sản phẩm đồng thời.
     * Sử dụng nativeQuery để tương thích tuyệt đối với TiDB Cloud,
     * tránh lỗi Hibernate tự sinh "FOR UPDATE OF <alias>".
     */
    @Query(value = "SELECT * FROM products WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<Product> findByIdWithLock(@Param("id") Long id);
}
