package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.DeliveryPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryPackageRepository extends JpaRepository<DeliveryPackage, Long> {

    Optional<DeliveryPackage> findByPackageName(String packageName);

    boolean existsByPackageName(String packageName);

    List<DeliveryPackage> findByStatusOrderByCreatedAtDesc(String status);

    @Query(value = "SELECT * FROM delivery_packages WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<DeliveryPackage> findByIdWithLock(@Param("id") Long id);

    @Query(value = "SELECT * FROM delivery_packages WHERE package_name = :packageName FOR UPDATE", nativeQuery = true)
    Optional<DeliveryPackage> findByPackageNameWithLock(@Param("packageName") String packageName);

    Optional<DeliveryPackage> findFirstByShippedByStaffIdAndStatus(Long staffId, String status);

    boolean existsByShippedByStaffIdAndStatus(Long staffId, String status);

    List<DeliveryPackage> findByShippedByStaffIsNotNullAndCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
