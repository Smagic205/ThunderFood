package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.DeliveryPackage;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryPackageRepository extends JpaRepository<DeliveryPackage, Long> {

    Optional<DeliveryPackage> findByPackageName(String packageName);

    boolean existsByPackageName(String packageName);

    List<DeliveryPackage> findByStatusOrderByCreatedAtDesc(String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM DeliveryPackage p WHERE p.id = :id")
    Optional<DeliveryPackage> findByIdWithLock(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM DeliveryPackage p WHERE p.packageName = :packageName")
    Optional<DeliveryPackage> findByPackageNameWithLock(@Param("packageName") String packageName);

    Optional<DeliveryPackage> findFirstByShippedByStaffIdAndStatus(Long staffId, String status);

    boolean existsByShippedByStaffIdAndStatus(Long staffId, String status);
}
