package com.thunderfood.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /**
     * Tên voucher dễ nhớ cho nhân viên/admin quản lý
     * (ví dụ: "Miễn phí ship tháng 10", "Giảm 50k đơn từ 300k").
     */
    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 255)
    private String description;

    /**
     * Loại voucher — xác định áp dụng giảm gì:
     *   PRODUCT  – giảm giá trị đơn hàng (subtotal)
     *   SHIPPING – giảm phí giao hàng (shipping_fee)
     */
    @Builder.Default
    @Column(name = "voucher_type", nullable = false, length = 30)
    private String voucherType = "PRODUCT";

    @Column(name = "discount_type", nullable = false, length = 20)
    private String discountType; // PERCENT, FIXED_AMOUNT

    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    @Builder.Default
    @Column(name = "min_order_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Column(name = "max_discount_amount", precision = 12, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "usage_limit")
    private Integer usageLimit; // NULL = không giới hạn

    @Builder.Default
    @Column(name = "used_count", nullable = false)
    private Integer usedCount = 0;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
