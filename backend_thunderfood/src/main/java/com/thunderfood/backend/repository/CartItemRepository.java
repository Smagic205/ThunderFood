package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    @Query("SELECT ci.product.id, ci.quantity FROM CartItem ci WHERE ci.cart.user.id = :userId AND ci.product.id IN :productIds")
    List<Object[]> findCartQuantitiesByUserIdAndProductIdIn(@Param("userId") Long userId, @Param("productIds") Collection<Long> productIds);

    @Query("SELECT ci.quantity FROM CartItem ci WHERE ci.cart.user.id = :userId AND ci.product.id = :productId")
    Optional<Integer> findQuantityByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);

    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);

    Optional<CartItem> findByIdAndCartUserId(Long id, Long userId);

    @Query("SELECT COALESCE(SUM(ci.quantity), 0) FROM CartItem ci WHERE ci.cart.user.id = :userId")
    Integer sumQuantityByUserId(@Param("userId") Long userId);

    void deleteByCartId(Long cartId);

    void deleteByProductId(Long productId);

    List<CartItem> findByCartId(Long cartId);
}
