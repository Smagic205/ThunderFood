package com.thunderfood.backend.entity;
 
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "voucher_usages",
        indexes = {
                @Index(name = "idx_voucher_usages_voucher_user", columnList = "voucher_id, user_id, is_reverted"),
                @Index(name = "idx_voucher_usages_order", columnList = "order_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id", nullable = false)
    private Voucher voucher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @CreationTimestamp
    @Column(name = "used_at", nullable = false, updatable = false)
    private LocalDateTime usedAt;

    /**
     * Đánh dấu đã hoàn lại lượt dùng khi đơn hàng bị hủy hay chưa.
     * Mặc định là false. Khi đơn bị CANCELLED, chuyển sang true.
     */
    @Builder.Default
    @Column(name = "is_reverted", nullable = false)
    private Boolean isReverted = false;
}
