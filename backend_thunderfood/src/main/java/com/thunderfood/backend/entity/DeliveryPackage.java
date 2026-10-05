package com.thunderfood.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Tên gói do nhân viên đặt khi xác nhận đơn.
     * Là khoá duy nhất — nhân viên nhập tên gói, hệ thống tạo mới nếu chưa tồn tại,
     * hoặc thêm đơn vào gói đã có nếu tên trùng.
     */
    @Column(name = "package_name", nullable = false, unique = true, length = 100)
    private String packageName;

    /**
     * Nhân viên nhận giao gói này (NULL cho tới khi có người bấm "Nhận giao").
     * Khi nhận giao, tất cả đơn trong gói cũng được gán delivered_by_staff_id = người này.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipped_by_staff_id")
    private User shippedByStaff;

    /**
     * Số đơn tối đa được gộp vào gói này.
     * Lấy từ system_settings.MAX_ORDERS_PER_PACKAGE tại thời điểm tạo gói, mặc định 7.
     */
    @Builder.Default
    @Column(name = "max_orders", nullable = false)
    private Integer maxOrders = 7;

    /**
     * Trạng thái gói, được SUY RA từ trạng thái các đơn bên trong,
     * nhưng lưu lại để truy vấn nhanh:
     *   PENDING    – chưa có ai nhận giao (mặc định)
     *   DELIVERING – đã có nhân viên nhận giao, ít nhất 1 đơn đang DELIVERING
     *   COMPLETED  – tất cả đơn đã là DELIVERED hoặc CANCELLED
     */
    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private String status = "PENDING";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Thời điểm gói hoàn thành (tất cả đơn = DELIVERED hoặc CANCELLED).
     * NULL cho tới khi điều kiện đó xảy ra.
     */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
