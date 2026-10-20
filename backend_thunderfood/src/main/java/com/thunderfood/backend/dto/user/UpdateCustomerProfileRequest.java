package com.thunderfood.backend.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Dữ liệu yêu cầu cập nhật thông tin khách hàng (Email cố định theo tài khoản, không cho phép chỉnh sửa)")
public class UpdateCustomerProfileRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 2, max = 150, message = "Họ và tên phải từ 2 đến 150 ký tự")
    @Schema(description = "Họ và tên khách hàng", example = "Nguyễn Văn A")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(
            regexp = "^(0|\\+84)(\\s|\\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\\d)(\\s|\\.)?(\\d{3})(\\s|\\.)?(\\d{3})$",
            message = "Số điện thoại không đúng định dạng"
    )
    @Schema(description = "Số điện thoại liên hệ", example = "0987654321")
    private String phone;

    @Size(max = 500, message = "URL ảnh đại diện không được vượt quá 500 ký tự")
    @Schema(description = "URL ảnh đại diện (tùy chọn)", example = "https://example.com/avatar.jpg")
    private String avatarUrl;
}
