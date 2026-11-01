package com.thunderfood.backend.dto.voucher;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherRequest {

    @NotBlank(message = "Mã voucher không được để trống")
    @Size(min = 3, max = 50, message = "Mã voucher phải từ 3 đến 50 ký tự")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Mã voucher chỉ chứa ký tự chữ cái, số, gạch dưới hoặc gạch nối")
    private String code;

    @NotBlank(message = "Tên voucher không được để trống")
    @Size(max = 150, message = "Tên voucher không được vượt quá 150 ký tự")
    private String name;

    @Size(max = 255, message = "Mô tả không được vượt quá 255 ký tự")
    private String description;

    @NotBlank(message = "Loại voucher không được để trống")
    @Pattern(regexp = "^(PRODUCT|SHIPPING)$", message = "Loại voucher chỉ chấp nhận PRODUCT hoặc SHIPPING")
    private String voucherType;

    @NotBlank(message = "Hình thức giảm giá không được để trống")
    @Pattern(regexp = "^(PERCENT|FIXED_AMOUNT)$", message = "Hình thức giảm giá chỉ chấp nhận PERCENT hoặc FIXED_AMOUNT")
    private String discountType;

    @NotNull(message = "Giá trị giảm không được để trống")
    @DecimalMin(value = "0.01", message = "Giá trị giảm phải lớn hơn 0")
    private BigDecimal discountValue;

    @Builder.Default
    @DecimalMin(value = "0.00", message = "Giá trị đơn hàng tối thiểu không thể âm")
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @DecimalMin(value = "0.01", message = "Mức giảm tối đa phải lớn hơn 0")
    private BigDecimal maxDiscountAmount;

    @Min(value = 1, message = "Tổng lượt sử dụng phải lớn hơn hoặc bằng 1")
    private Integer usageLimit;

    @Builder.Default
    @Min(value = 1, message = "Lượt sử dụng mỗi khách hàng phải lớn hơn hoặc bằng 1")
    private Integer usageLimitPerUser = 1;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startDate;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endDate;

    @Builder.Default
    private Boolean isActive = true;
}
