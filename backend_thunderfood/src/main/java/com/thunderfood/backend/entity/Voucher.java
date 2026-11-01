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
    @Column(name = "usage_limit_per_user")
    private Integer usageLimitPerUser = 1;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @org.hibernate.annotations.UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ── Helper methods ────────────────────────────────────────────────────────

    public boolean isProductVoucher() {
        return "PRODUCT".equalsIgnoreCase(this.voucherType);
    }

    public boolean isShippingVoucher() {
        return "SHIPPING".equalsIgnoreCase(this.voucherType);
    }

    public boolean isPercentDiscount() {
        return "PERCENT".equalsIgnoreCase(this.discountType);
    }

    public boolean isFixedAmountDiscount() {
        return "FIXED_AMOUNT".equalsIgnoreCase(this.discountType);
    }

    public boolean isUpcoming(LocalDateTime now) {
        return this.startDate != null && now.isBefore(this.startDate);
    }

    public boolean isExpired(LocalDateTime now) {
        return this.endDate != null && now.isAfter(this.endDate);
    }

    public boolean isDepleted() {
        return this.usageLimit != null && this.usedCount != null && this.usedCount >= this.usageLimit;
    }

    public String computeStatus(LocalDateTime now) {
        if (Boolean.FALSE.equals(this.isActive)) {
            return "INACTIVE";
        }
        if (isUpcoming(now)) {
            return "UPCOMING";
        }
        if (isExpired(now)) {
            return "EXPIRED";
        }
        if (isDepleted()) {
            return "DEPLETED";
        }
        return "ACTIVE";
    }
}
