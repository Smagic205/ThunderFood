package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.UserToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
    Optional<UserToken> findByToken(String token);
    Optional<UserToken> findByUserIdAndType(Long userId, String type);
    List<UserToken> findAllByUserIdAndType(Long userId, String type);
    void deleteByUserIdAndType(Long userId, String type);
}
