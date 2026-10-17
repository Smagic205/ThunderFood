package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Set;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    @Query("SELECT w.product.id FROM Wishlist w WHERE w.user.id = :userId AND w.product.id IN :productIds")
    Set<Long> findProductIdsByUserIdAndProductIdIn(@Param("userId") Long userId, @Param("productIds") Collection<Long> productIds);

    boolean existsByUserIdAndProductId(Long userId, Long productId);
}
