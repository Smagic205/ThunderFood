package com.thunderfood.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "service_wards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceWard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /**
     * Tên quận/huyện (ví dụ: Đống Đa, Cầu Giấy).
     * Dùng để nhóm lại trong combo box cấp 1 khi khách chọn địa chỉ.
     */
    @Column(nullable = false, length = 100)
    private String district;

    /**
     * Tên phường/xã (ví dụ: Yên Lãng, Trung Tự).
     * Hiển thị ở combo box cấp 2 sau khi khách đã chọn quận.
     */
    @Column(name = "ward_name", nullable = false, length = 100)
    private String wardName;

    /**
     * Phí ship mặc định áp dụng cho phường này.
     * Được dùng làm giá trị gốc (original_shipping_fee) khi tính phí checkout.
     */
    @Builder.Default
    @Column(name = "shipping_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    /**
     * Cờ kích hoạt — chỉ phường có is_active = TRUE mới hiện trong combo box.
     */
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
