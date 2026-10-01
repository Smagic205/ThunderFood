-- =====================================================================
-- FLYWAY MIGRATION V1: TẠO SCHEMA BAN ĐẦU
-- Đường dẫn phải đặt tại: src/main/resources/db/migration/V1__init_schema.sql
-- Flyway sẽ tự chạy file này khi Spring Boot khởi động lần đầu.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. NGƯỜI DÙNG & PHÂN QUYỀN
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),
    auth_provider   VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    provider_id     VARCHAR(255) UNIQUE,
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    role_id         INT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS addresses (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    receiver_name   VARCHAR(150) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    detail_address  VARCHAR(500) NOT NULL,
    ward            VARCHAR(100),
    district        VARCHAR(100),
    province        VARCHAR(100),
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_addresses_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_tokens (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    token           VARCHAR(500) NOT NULL,
    type            VARCHAR(30) NOT NULL,
    expires_at      DATETIME NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_tokens_token (token(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 2. DANH MỤC & SẢN PHẨM
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    slug            VARCHAR(150) NOT NULL UNIQUE,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id     INT NOT NULL,
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(200) NOT NULL UNIQUE,
    description     TEXT,
    price           DECIMAL(12,2) NOT NULL,
    discount_price  DECIMAL(12,2),
    stock_quantity  INT NOT NULL DEFAULT 0,
    sold_count      INT NOT NULL DEFAULT 0,
    avg_rating      DECIMAL(2,1) NOT NULL DEFAULT 0.0,
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_products_category (category_id),
    INDEX idx_products_name (name),
    INDEX idx_products_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_images (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id      BIGINT NOT NULL,
    image_url       VARCHAR(500) NOT NULL,
    is_thumbnail    BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order      INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_images_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 3. GIỎ HÀNG
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS carts (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL UNIQUE,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cart_items (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id         BIGINT NOT NULL,
    product_id      BIGINT NOT NULL,
    quantity        INT NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE KEY uq_cart_product (cart_id, product_id),
    INDEX idx_cart_items_cart (cart_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 4. KHUYẾN MÃI / VOUCHER
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vouchers (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    code                VARCHAR(50) NOT NULL UNIQUE,
    description         VARCHAR(255),
    discount_type       VARCHAR(20) NOT NULL,
    discount_value      DECIMAL(12,2) NOT NULL,
    min_order_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
    max_discount_amount DECIMAL(12,2),
    usage_limit         INT,
    used_count          INT NOT NULL DEFAULT 0,
    start_date          DATETIME NOT NULL,
    end_date            DATETIME NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX idx_vouchers_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 5. ĐƠN HÀNG
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS orders (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_code      VARCHAR(30) NOT NULL UNIQUE,
    user_id         BIGINT NOT NULL,
    address_id      BIGINT,
    voucher_id      BIGINT,
    receiver_name   VARCHAR(150) NOT NULL,
    receiver_phone  VARCHAR(20) NOT NULL,
    shipping_address VARCHAR(500) NOT NULL,
    subtotal_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_fee    DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount    DECIMAL(12,2) NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_method  VARCHAR(30) NOT NULL,
    payment_status  VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    note            VARCHAR(500),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_orders_address FOREIGN KEY (address_id) REFERENCES addresses(id),
    CONSTRAINT fk_orders_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id        BIGINT NOT NULL,
    product_id      BIGINT NOT NULL,
    product_name    VARCHAR(200) NOT NULL,
    product_price   DECIMAL(12,2) NOT NULL,
    quantity        INT NOT NULL,
    line_total      DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_status_history (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id        BIGINT NOT NULL,
    status          VARCHAR(30) NOT NULL,
    note            VARCHAR(255),
    changed_by      BIGINT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_status_history_user FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_order_status_history_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 6. THANH TOÁN
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payments (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id            BIGINT NOT NULL,
    provider            VARCHAR(30) NOT NULL,
    transaction_code    VARCHAR(100),
    amount              DECIMAL(12,2) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    raw_response        TEXT,
    paid_at             DATETIME,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_payments_order (order_id),
    INDEX idx_payments_transaction_code (transaction_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 7. ĐÁNH GIÁ & YÊU THÍCH
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reviews (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id      BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    order_id        BIGINT,
    rating          TINYINT NOT NULL,
    comment         TEXT,
    image_url       VARCHAR(500),
    is_hidden       BOOLEAN NOT NULL DEFAULT FALSE,
    admin_reply     TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_reviews_product (product_id),
    INDEX idx_reviews_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wishlists (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    product_id      BIGINT NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlists_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uq_wishlist_user_product (user_id, product_id),
    INDEX idx_wishlists_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 8. THÔNG BÁO
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    title           VARCHAR(255) NOT NULL,
    content         VARCHAR(1000) NOT NULL,
    type            VARCHAR(30) NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 9. CẤU HÌNH HỆ THỐNG
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS banners (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    image_url       VARCHAR(500) NOT NULL,
    link_url        VARCHAR(500),
    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS system_settings (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    setting_key     VARCHAR(100) NOT NULL UNIQUE,
    setting_value   VARCHAR(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- DỮ LIỆU MẶC ĐỊNH
-- ---------------------------------------------------------------------

INSERT IGNORE INTO roles (name) VALUES ('ADMIN'), ('STAFF'), ('CUSTOMER');

INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES
    ('DEFAULT_SHIPPING_FEE', '15000'),
    ('FREE_SHIPPING_THRESHOLD', '200000');
