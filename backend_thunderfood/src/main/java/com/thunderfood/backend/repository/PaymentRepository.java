package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findTopByOrderIdOrderByCreatedAtDesc(Long orderId);

    Optional<Payment> findTopByOrderIdAndProviderAndStatusOrderByCreatedAtDesc(Long orderId, String provider, String status);

    boolean existsByTransactionCodeAndStatus(String transactionCode, String status);

    Page<Payment> findByOrderUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
