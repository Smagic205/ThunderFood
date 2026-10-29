package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.UserToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
    Optional<UserToken> findByToken(String token);
    Optional<UserToken> findByTokenAndType(String token, String type);
    Optional<UserToken> findByUserIdAndType(Long userId, String type);
    List<UserToken> findAllByUserIdAndType(Long userId, String type);
    List<UserToken> findByUserIdAndTypeOrderByCreatedAtAsc(Long userId, String type);
    void deleteByToken(String token);
    void deleteByUserIdAndType(Long userId, String type);

    @Modifying
    @Transactional
    @Query("DELETE FROM UserToken t WHERE t.expiresAt < :now")
    int deleteAllExpiredTokens(@Param("now") LocalDateTime now);
}
