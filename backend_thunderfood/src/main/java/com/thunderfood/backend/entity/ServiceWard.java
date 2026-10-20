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
     * Tên phường/xã (ví dụ: Yên Lãng, Trung Tự).
     * Hiển thị trong flat list có thể tìm kiếm theo tên —
     * khách gõ để lọc, không còn chọn quận trước nữa.
     */
    @Column(name = "ward_name", nullable = false, length = 100)
    private String wardName;

    /**
     * Loại đơn vị hành chính:
     *   PHUONG – Phường (khu vực đô thị)
     *   XA     – Xã    (khu vực ngoại thành)
     * Dùng để hiển thị tiền tố đầy đủ: "Phường Yên Lãng" / "Xã Trung Tự".
     */
    @Builder.Default
    @Column(nullable = false, length = 10)
    private String type = "PHUONG"; // PHUONG | XA

    /**
     * Phí ship áp dụng cho phường/xã này.
     * Dùng làm original_shipping_fee khi tính phí checkout.
     */
    @Builder.Default
    @Column(name = "shipping_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    /**
     * Cờ kích hoạt — chỉ phường/xã có is_active = TRUE mới hiện trong danh sách.
     */
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
