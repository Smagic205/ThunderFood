-- =====================================================================
-- FLYWAY MIGRATION V3: ĐỒNG BỘ SCHEMA ENTITY & BỔ SUNG CONSTRAINTS/INDEXES
-- =====================================================================

-- 1. Tạo bảng voucher_usages (VoucherUsage.java)
CREATE TABLE IF NOT EXISTS voucher_usages (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    voucher_id      BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    order_id        BIGINT,
    discount_amount DECIMAL(12,2) NOT NULL,
    used_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_reverted     BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_voucher_usages_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
    CONSTRAINT fk_voucher_usages_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_voucher_usages_order FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_voucher_usages_voucher_user (voucher_id, user_id, is_reverted),
    INDEX idx_voucher_usages_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Đồng bộ các cột còn thiếu so với JPA Entities
ALTER TABLE service_wards
    ADD COLUMN IF NOT EXISTS district VARCHAR(100) AFTER ward_name,
    ADD INDEX idx_service_wards_district (district);

ALTER TABLE user_tokens
    ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0 AFTER expires_at,
    ADD COLUMN IF NOT EXISTS device_info     VARCHAR(255) AFTER failed_attempts,
    ADD COLUMN IF NOT EXISTS ip_address      VARCHAR(50) AFTER device_info,
    ADD INDEX idx_user_tokens_user_type (user_id, type),
    ADD INDEX idx_user_tokens_expires (expires_at);

ALTER TABLE vouchers
    ADD COLUMN IF NOT EXISTS usage_limit_per_user INT DEFAULT 1 AFTER end_date,
    ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ADD INDEX idx_vouchers_active_dates (is_active, start_date, end_date),
    ADD INDEX idx_vouchers_type (voucher_type);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100) AFTER order_code,
    ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0,
    ADD UNIQUE KEY uk_orders_user_idempotency (user_id, idempotency_key),
    ADD INDEX idx_orders_status (status),
    ADD INDEX idx_orders_created (created_at),
    ADD INDEX idx_orders_payment (payment_method, payment_status, status);

-- 3. Ràng buộc duy nhất trên reviews (1 lượt đánh giá mỗi (user, product, order))
ALTER TABLE reviews
    ADD CONSTRAINT uk_reviews_user_product_order UNIQUE (user_id, product_id, order_id),
    ADD INDEX idx_reviews_order (order_id);
