package com.thunderfood.backend.dto.staff;

import lombok.Data;

/**
 * Request body khi nhân viên xác nhận đơn hàng và gán vào gói.
 * Nếu packageName chưa tồn tại → tạo gói mới.
 * Nếu đã tồn tại → thêm đơn vào gói đó (kiểm tra không vượt max_orders).
 */
@Data
public class ConfirmOrderRequest {

    /** Tên gói hàng do nhân viên đặt (bắt buộc). */
    private String packageName;
}
