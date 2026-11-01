package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.VoucherUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoucherUsageRepository extends JpaRepository<VoucherUsage, Long> {

    long countByVoucherIdAndUserIdAndIsRevertedFalse(Long voucherId, Long userId);

    List<VoucherUsage> findByOrderId(Long orderId);

    List<VoucherUsage> findByUserIdOrderByUsedAtDesc(Long userId);

    long countByVoucherIdAndIsRevertedFalse(Long voucherId);
}
