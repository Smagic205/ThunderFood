package com.thunderfood.backend.dto.user;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.thunderfood.backend.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin chi tiết hồ sơ khách hàng (bao gồm email cố định theo tài khoản)")
public class CustomerProfileResponse {

    @Schema(description = "ID người dùng", example = "1")
    private Long id;

    @Schema(description = "Họ và tên khách hàng", example = "Nguyễn Văn A")
    private String fullName;

    @Schema(description = "Email tài khoản (duy nhất, không thể thay đổi)", example = "nguyenvana@gmail.com")
    private String email;

    @Schema(description = "Số điện thoại liên hệ", example = "0987654321")
    private String phone;

    @Schema(description = "URL ảnh đại diện", example = "https://example.com/avatar.jpg")
    private String avatarUrl;

    @Schema(description = "Vai trò trong hệ thống", example = "CUSTOMER")
    private String role;

    @Schema(description = "Phương thức xác thực", example = "LOCAL")
    private String authProvider;

    @Schema(description = "Trạng thái tài khoản", example = "ACTIVE")
    private String status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "Thời gian tạo tài khoản")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "Thời gian cập nhật gần nhất")
    private LocalDateTime updatedAt;

    public static CustomerProfileResponse fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return CustomerProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .authProvider(user.getAuthProvider())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
