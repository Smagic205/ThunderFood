package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRoleNameOrderByCreatedAtDesc(String roleName);
    long countByRoleName(String roleName);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
