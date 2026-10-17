package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    @Query("SELECT pi FROM ProductImage pi WHERE pi.product.id IN :productIds ORDER BY pi.isThumbnail DESC, pi.sortOrder ASC")
    List<ProductImage> findByProductIdInOrderByPriority(@Param("productIds") Collection<Long> productIds);

    List<ProductImage> findByProductIdOrderByIsThumbnailDescSortOrderAsc(Long productId);
}
