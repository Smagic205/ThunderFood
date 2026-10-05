package com.thunderfood.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "receiver_name", nullable = false, length = 150)
    private String receiverName;

    @Column(nullable = false, length = 20)
    private String phone;

    /**
     * Phường/xã được chọn qua combo box 2 cấp (Quận → Phường).
     * Chỉ hiện phường có is_active = TRUE và thuộc quận đã chọn.
     * Khách KHÔNG được tự gõ — phải chọn từ danh sách.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id", nullable = false)
    private ServiceWard ward;

    /**
     * Địa chỉ chi tiết: số nhà, ngõ, tên đường (ví dụ: "120 Yên Lãng", "Ngõ 5 Đặng Tiến Đông").
     * Khách tự nhập — hệ thống dùng LIKE search trong phạm vi đã lọc ward.
     */
    @Column(name = "detail_address", nullable = false, length = 500)
    private String detailAddress;

    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
