package com.thunderfood.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Mã OTP không được để trống")
    private String otp;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[@#$%^&+=!_]).{8,12}$", 
             message = "Mật khẩu phải từ 8-12 ký tự, chứa ít nhất một chữ hoa và một ký tự đặc biệt")
    private String newPassword;
}
