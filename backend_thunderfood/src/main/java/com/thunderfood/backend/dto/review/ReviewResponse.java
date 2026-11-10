package com.thunderfood.backend.dto.review;

import com.thunderfood.backend.entity.Review;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String productSlug;
    private Long userId;
    private String userName;
    private String userAvatar;
    private Long orderId;
    private Short rating;
    private String comment;
    private String imageUrl;
    private Boolean isHidden;
    private String staffReply;
    private Long repliedByStaffId;
    private String repliedByStaffName;
    private LocalDateTime repliedAt;
    private LocalDateTime createdAt;

    public static ReviewResponse fromEntity(Review review) {
        if (review == null) {
            return null;
        }

        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct() != null ? review.getProduct().getId() : null)
                .productName(review.getProduct() != null ? review.getProduct().getName() : null)
                .productSlug(review.getProduct() != null ? review.getProduct().getSlug() : null)
                .userId(review.getUser() != null ? review.getUser().getId() : null)
                .userName(review.getUser() != null ? review.getUser().getFullName() : null)
                .userAvatar(review.getUser() != null ? review.getUser().getAvatarUrl() : null)
                .orderId(review.getOrder() != null ? review.getOrder().getId() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .imageUrl(review.getImageUrl())
                .isHidden(review.getIsHidden())
                .staffReply(review.getStaffReply())
                .repliedByStaffId(review.getRepliedByStaff() != null ? review.getRepliedByStaff().getId() : null)
                .repliedByStaffName(review.getRepliedByStaff() != null ? review.getRepliedByStaff().getFullName() : null)
                .repliedAt(review.getRepliedAt())
                .createdAt(review.getCreatedAt())
                .build();
    }
}

