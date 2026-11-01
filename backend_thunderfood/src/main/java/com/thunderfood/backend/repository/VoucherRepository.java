package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.Voucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {

    Optional<Voucher> findByCode(String code);

    Optional<Voucher> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    @Query("SELECT v FROM Voucher v WHERE v.isActive = true " +
           "AND v.startDate <= :now AND v.endDate >= :now " +
           "AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit) " +
           "ORDER BY v.createdAt DESC")
    List<Voucher> findAvailableVouchers(@Param("now") LocalDateTime now);

    @Query("SELECT v FROM Voucher v WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(v.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(v.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:voucherType IS NULL OR :voucherType = '' OR v.voucherType = :voucherType) AND " +
           "(:isActive IS NULL OR v.isActive = :isActive)")
    Page<Voucher> findAllWithFilters(
            @Param("keyword") String keyword,
            @Param("voucherType") String voucherType,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );
}
