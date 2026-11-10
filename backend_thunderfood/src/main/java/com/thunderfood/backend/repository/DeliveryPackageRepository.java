package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.DeliveryPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryPackageRepository extends JpaRepository<DeliveryPackage, Long> {

    Optional<DeliveryPackage> findByPackageName(String packageName);

    boolean existsByPackageName(String packageName);

    List<DeliveryPackage> findByStatusOrderByCreatedAtDesc(String status);
}

