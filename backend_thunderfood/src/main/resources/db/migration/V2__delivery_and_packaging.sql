-- =====================================================================
-- FLYWAY MIGRATION V2: QUẢN LÝ ĐÓNG GÓI VÀ GIAO HÀNG
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. BẢNG PHƯỜNG/XÃ ĐƯỢC PHỤC VỤ (Hà Nội)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS service_wards (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    district        VARCHAR(100) NOT NULL          COMMENT 'Tên quận/huyện (vd: Đống Đa, Cầu Giấy)',
    ward_name       VARCHAR(100) NOT NULL          COMMENT 'Tên phường/xã (vd: Yên Lãng, Trung Tự)',
    shipping_fee    DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Phí ship áp dụng cho phường này',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE  COMMENT 'Có phục vụ phường này không',
    INDEX idx_service_wards_district (district),
    INDEX idx_service_wards_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Danh sách phường/xã tại Hà Nội được phép giao hàng';

-- ---------------------------------------------------------------------
-- 2. SỬA BẢNG ADDRESSES
--    - Bỏ cột ward (text tự do), district (text tự do), province (cố định Hà Nội)
--    - Thêm ward_id FK -> service_wards
--    - detail_address giữ nguyên, dùng làm địa chỉ chi tiết (số nhà, ngõ, tên đường...)
-- ---------------------------------------------------------------------

ALTER TABLE addresses
    DROP COLUMN ward,
    DROP COLUMN district,
    DROP COLUMN province,
    ADD COLUMN ward_id INT NOT NULL AFTER phone,
    ADD CONSTRAINT fk_addresses_ward FOREIGN KEY (ward_id) REFERENCES service_wards(id),
    ADD INDEX idx_addresses_ward (ward_id);

ALTER TABLE addresses
    MODIFY COLUMN detail_address VARCHAR(500) NOT NULL
    COMMENT 'Địa chỉ chi tiết: số nhà, ngõ, tên đường (vd: 120 Yên Lãng)';

-- ---------------------------------------------------------------------
-- 3. BẢNG GÓI HÀNG / CHUYẾN GIAO
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS delivery_packages (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    package_name        VARCHAR(100) NOT NULL UNIQUE   COMMENT 'Tên gói do nhân viên đặt khi xác nhận đơn',
    shipped_by_staff_id BIGINT                         COMMENT 'Nhân viên nhận giao gói (NULL cho tới khi có người nhận)',
    max_orders          INT NOT NULL DEFAULT 7         COMMENT 'Số đơn tối đa trong gói (lấy từ system_settings)',
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING'
                                                       COMMENT 'PENDING=chưa giao, DELIVERING=đang giao, COMPLETED=hoàn thành',
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at        DATETIME                       COMMENT 'NULL cho tới khi tất cả đơn đã DELIVERED/CANCELLED',
    CONSTRAINT fk_delivery_packages_staff FOREIGN KEY (shipped_by_staff_id) REFERENCES users(id),
    INDEX idx_delivery_packages_staff (shipped_by_staff_id),
    INDEX idx_delivery_packages_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Gói hàng đại diện cho 1 chuyến giao, gộp nhiều đơn lại';

-- ---------------------------------------------------------------------
-- 4. SỬA BẢNG ORDERS
--    - Tách voucher_id thành 2 FK riêng:
--        product_voucher_id  -> vouchers (loại PRODUCT, giảm subtotal)
--        shipping_voucher_id -> vouchers (loại SHIPPING, giảm shipping_fee)
--      Mỗi loại tối đa 1 voucher/đơn, cả 2 đều nullable.
--    - Thêm package_id FK -> delivery_packages
--      (ai giao đơn -> JOIN qua package_id lấy shipped_by_staff_id, không cần cột riêng)
--    - Thêm delivered_at DATETIME (thời điểm xác nhận giao từng đơn)
--    - Thêm original_shipping_fee: phí ship gốc theo ward trước khi giảm
--      discount_amount     = giảm từ product_voucher (chỉ giảm sản phẩm)
--      shipping_fee        = original_shipping_fee - giảm từ shipping_voucher (>= 0)
--    - Cập nhật comment cột status: chỉ dùng 5 giá trị
-- ---------------------------------------------------------------------

-- Bỏ cột voucher_id cũ (1 voucher chung), thay bằng 2 FK theo loại
ALTER TABLE orders
    DROP FOREIGN KEY fk_orders_voucher,
    DROP COLUMN voucher_id,
    ADD COLUMN product_voucher_id   BIGINT AFTER address_id
        COMMENT 'Voucher giảm giá sản phẩm (loại PRODUCT), NULL nếu không dùng',
    ADD COLUMN shipping_voucher_id  BIGINT AFTER product_voucher_id
        COMMENT 'Voucher giảm phí ship (loại SHIPPING), NULL nếu không dùng',
    ADD CONSTRAINT fk_orders_product_voucher  FOREIGN KEY (product_voucher_id)  REFERENCES vouchers(id),
    ADD CONSTRAINT fk_orders_shipping_voucher FOREIGN KEY (shipping_voucher_id) REFERENCES vouchers(id),
    ADD INDEX idx_orders_product_voucher (product_voucher_id),
    ADD INDEX idx_orders_shipping_voucher (shipping_voucher_id);

ALTER TABLE orders
    ADD COLUMN package_id               BIGINT   AFTER shipping_voucher_id,
    ADD COLUMN delivered_at             DATETIME AFTER package_id,
    ADD COLUMN original_shipping_fee    DECIMAL(12,2) NOT NULL DEFAULT 0
        COMMENT 'Phí ship gốc theo ward (service_wards.shipping_fee) trước khi áp voucher ship'
        AFTER shipping_fee,
    ADD CONSTRAINT fk_orders_package    FOREIGN KEY (package_id) REFERENCES delivery_packages(id),
    ADD INDEX idx_orders_package (package_id);

ALTER TABLE orders
    MODIFY COLUMN discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0
        COMMENT 'Giảm giá từ product_voucher (chỉ giảm sản phẩm, không gộp giảm ship)',
    MODIFY COLUMN shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0
        COMMENT 'Phí ship thực tế = original_shipping_fee - giảm từ shipping_voucher (>= 0)',
    MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        COMMENT 'PENDING→CONFIRMED→DELIVERING→DELIVERED | CANCELLED';


-- ---------------------------------------------------------------------
-- 5. SỬA BẢNG REVIEWS
--    - Đổi admin_reply thành staff_reply
--    - Thêm replied_by_staff_id FK -> users
--    - Thêm replied_at DATETIME
-- ---------------------------------------------------------------------

ALTER TABLE reviews
    CHANGE COLUMN admin_reply staff_reply TEXT    COMMENT 'Nội dung phản hồi của nhân viên/admin',
    ADD COLUMN replied_by_staff_id  BIGINT        AFTER staff_reply,
    ADD COLUMN replied_at           DATETIME      AFTER replied_by_staff_id,
    ADD CONSTRAINT fk_reviews_replied_by FOREIGN KEY (replied_by_staff_id) REFERENCES users(id);

-- ---------------------------------------------------------------------
-- 6. SỬA BẢNG VOUCHERS
--    - Thêm cột voucher_type để phân biệt voucher giảm giá sản phẩm và voucher giảm ship
--    - Thêm cột name để đặt tên voucher cho dễ quản lý
-- ---------------------------------------------------------------------

ALTER TABLE vouchers
    ADD COLUMN name         VARCHAR(150) NOT NULL DEFAULT '' AFTER code,
    ADD COLUMN voucher_type VARCHAR(30)  NOT NULL DEFAULT 'PRODUCT'
        COMMENT 'PRODUCT=giảm giá sản phẩm, SHIPPING=giảm phí ship'
        AFTER discount_type;

-- ---------------------------------------------------------------------
-- 7. CẬP NHẬT DỮ LIỆU MẶC ĐỊNH CHO SYSTEM_SETTINGS
-- ---------------------------------------------------------------------

INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES
    ('MAX_ORDERS_PER_PACKAGE', '7');

-- ---------------------------------------------------------------------
-- DỮ LIỆU MẪU: MỘT SỐ PHƯỜNG HÀ NỘI
-- ---------------------------------------------------------------------

INSERT IGNORE INTO service_wards (district, ward_name, shipping_fee, is_active) VALUES
    -- Đống Đa
    ('Đống Đa', 'Yên Lãng',           20000, TRUE),
    ('Đống Đa', 'Trung Tự',           20000, TRUE),
    ('Đống Đa', 'Phương Liên',        20000, TRUE),
    ('Đống Đa', 'Kim Liên',           20000, TRUE),
    ('Đống Đa', 'Ô Chợ Dừa',         20000, TRUE),
    ('Đống Đa', 'Văn Miếu',          20000, TRUE),
    -- Cầu Giấy
    ('Cầu Giấy', 'Dịch Vọng',        22000, TRUE),
    ('Cầu Giấy', 'Dịch Vọng Hậu',    22000, TRUE),
    ('Cầu Giấy', 'Nghĩa Đô',         22000, TRUE),
    ('Cầu Giấy', 'Quan Hoa',         22000, TRUE),
    ('Cầu Giấy', 'Trung Hòa',        22000, TRUE),
    -- Hai Bà Trưng
    ('Hai Bà Trưng', 'Bạch Mai',     25000, TRUE),
    ('Hai Bà Trưng', 'Thanh Nhàn',   25000, TRUE),
    ('Hai Bà Trưng', 'Bách Khoa',    25000, TRUE),
    -- Thanh Xuân
    ('Thanh Xuân', 'Nhân Chính',     27000, TRUE),
    ('Thanh Xuân', 'Khương Đình',    27000, TRUE),
    ('Thanh Xuân', 'Thanh Xuân Bắc', 27000, TRUE),
    -- Hoàn Kiếm
    ('Hoàn Kiếm', 'Hàng Bài',       30000, TRUE),
    ('Hoàn Kiếm', 'Tràng Tiền',     30000, TRUE),
    ('Hoàn Kiếm', 'Chương Dương',    30000, TRUE);
