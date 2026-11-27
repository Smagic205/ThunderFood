package com.thunderfood.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "reviews",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_reviews_user_product_order", columnNames = {"user_id", "product_id", "order_id"})
        },
        indexes = {
                @Index(name = "idx_reviews_product", columnList = "product_id"),
                @Index(name = "idx_reviews_user", columnList = "user_id"),
                @Index(name = "idx_reviews_order", columnList = "order_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order; // ràng buộc: chỉ review khi đã mua (tuỳ chọn)

    @Column(nullable = false)
    private Short rating; // 1 - 5

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Builder.Default
    @Column(name = "is_hidden", nullable = false)
    private Boolean isHidden = false;

    /**
     * Nội dung phản hồi của nhân viên hoặc admin.
     * (Đổi từ admin_reply → staff_reply vì cả ADMIN và STAFF đều có thể trả lời.)
     */
    @Column(name = "staff_reply", columnDefinition = "TEXT")
    private String staffReply;

    /**
     * Nhân viên hoặc admin đã trả lời đánh giá này.
     * NULL nếu chưa được trả lời.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replied_by_staff_id")
    private User repliedByStaff;

    /** Thời điểm trả lời. NULL nếu chưa trả lời. */
    @Column(name = "replied_at")
    private LocalDateTime repliedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
