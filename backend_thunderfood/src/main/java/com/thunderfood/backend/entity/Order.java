package com.thunderfood.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders") // tên bảng "orders" vì "order" là từ khoá dành riêng trong SQL
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_code", nullable = false, unique = true, length = 30)
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    private Address address;

    /**
     * Voucher giảm giá sản phẩm (loại PRODUCT).
     * NULL nếu đơn không dùng voucher sản phẩm.
     * Ảnh hưởng đến discount_amount.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_voucher_id")
    private Voucher productVoucher;

    /**
     * Voucher giảm phí ship (loại SHIPPING).
     * NULL nếu đơn không dùng voucher ship.
     * Ảnh hưởng đến shipping_fee (= original_shipping_fee - giảm ship).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipping_voucher_id")
    private Voucher shippingVoucher;

    /**
     * Gói hàng chứa đơn này.
     * NULL nếu đơn chưa được nhân viên gộp vào gói nào.
     * Chỉ bên nhân viên/admin thấy — khách không cần biết đơn thuộc gói nào.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id")
    private DeliveryPackage deliveryPackage;

    /** Thời điểm xác nhận giao thành công. NULL cho tới khi giao xong. */
    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    // ── Snapshot địa chỉ tại thời điểm đặt hàng ──────────────────────────

    @Column(name = "receiver_name", nullable = false, length = 150)
    private String receiverName;

    @Column(name = "receiver_phone", nullable = false, length = 20)
    private String receiverPhone;

    /** Địa chỉ giao hàng đầy đủ dạng chuỗi để hiển thị / in đơn. */
    @Column(name = "shipping_address", nullable = false, length = 500)
    private String shippingAddress;

    // ── Tiền ──────────────────────────────────────────────────────────────

    @Column(name = "subtotal_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotalAmount;

    /**
     * Giảm giá từ product_voucher (chỉ giảm sản phẩm, không gộp giảm ship).
     * = 0 nếu không dùng voucher sản phẩm.
     */
    @Builder.Default
    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    /**
     * Phí ship gốc theo ward (service_wards.shipping_fee) — lưu để đối soát.
     * Logic: original_shipping_fee = service_wards.shipping_fee của ward_id trong address.
     */
    @Builder.Default
    @Column(name = "original_shipping_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal originalShippingFee = BigDecimal.ZERO;

    /**
     * Phí ship thực tế khách trả = original_shipping_fee - shipping_discount.
     * 0 nếu được miễn phí ship hoàn toàn.
     */
    @Builder.Default
    @Column(name = "shipping_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    // ── Trạng thái ────────────────────────────────────────────────────────

    /**
     * Trạng thái đơn hàng — CHỈ 5 giá trị hợp lệ:
     *   PENDING    – chờ nhân viên xác nhận
     *   CONFIRMED  – đã xác nhận, đã gộp vào gói hàng
     *   DELIVERING – đang trên đường giao (khi nhân viên nhận giao gói)
     *   DELIVERED  – đã giao thành công
     *   CANCELLED  – đã hủy (khách hủy, nhân viên hủy, hoặc giao thất bại)
     */
    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "PENDING";

    // ── Thanh toán ────────────────────────────────────────────────────────

    @Column(name = "payment_method", nullable = false, length = 30)
    private String paymentMethod; // COD, VNPAY, MOMO, STRIPE

    @Builder.Default
    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus = "UNPAID"; // UNPAID, PAID, FAILED, REFUNDED

    // ── Khác ──────────────────────────────────────────────────────────────

    @Column(length = 500)
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();
}
