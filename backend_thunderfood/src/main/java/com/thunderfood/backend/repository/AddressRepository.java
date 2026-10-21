package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    /**
     * Lấy danh sách địa chỉ của người dùng, ưu tiên địa chỉ mặc định lên đầu, sau đó theo thời gian tạo mới nhất
     */
    List<Address> findByUserIdOrderByIsDefaultDescCreatedAtDesc(Long userId);

    /**
     * Tìm địa chỉ theo ID và userId để đảm bảo user chỉ truy cập/sửa địa chỉ của chính mình
     */
    Optional<Address> findByIdAndUserId(Long id, Long userId);

    /**
     * Tìm địa chỉ mặc định của người dùng
     */
    Optional<Address> findByUserIdAndIsDefaultTrue(Long userId);

    /**
     * Kiểm tra người dùng đã có địa chỉ nào chưa
     */
    boolean existsByUserId(Long userId);

    /**
     * Đặt lại toàn bộ địa chỉ của user về isDefault = false trước khi gán địa chỉ mặc định mới
     */
    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.user.id = :userId")
    void resetDefaultAddressForUser(@Param("userId") Long userId);
}
