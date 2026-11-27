package com.thunderfood.backend.dto.review;

import com.thunderfood.backend.validation.SafeUrl;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReviewRequest {

    @NotNull(message = "ID sản phẩm không được để trống")
    private Long productId;

    @NotNull(message = "ID đơn hàng không được để trống")
    private Long orderId;

    @NotNull(message = "Vui lòng chọn số sao đánh giá (1-5)")
    @Min(value = 1, message = "Đánh giá tối thiểu 1 sao")
    @Max(value = 5, message = "Đánh giá tối đa 5 sao")
    private Short rating;

    @Size(max = 1000, message = "Nội dung nhận xét tối đa 1000 ký tự")
    private String comment;

    @SafeUrl(message = "Đường dẫn ảnh đánh giá không hợp lệ hoặc không an toàn")
    private String imageUrl;
}

