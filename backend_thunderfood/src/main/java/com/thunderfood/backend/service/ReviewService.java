package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.review.CreateReviewRequest;
import com.thunderfood.backend.dto.review.ReviewResponse;
import com.thunderfood.backend.dto.review.StaffReplyReviewRequest;
import org.springframework.data.domain.Pageable;

public interface ReviewService {

    /**
     * Khách hàng gửi đánh giá món ăn đã mua
     */
    ReviewResponse createReview(Long userId, CreateReviewRequest request);

    /**
     * Lấy danh sách đánh giá của sản phẩm cho khách xem
     */
    PageResponse<ReviewResponse> getProductReviews(Long productId, Pageable pageable);

    /**
     * Lấy tất cả đánh giá cho nhân viên/admin xem
     */
    PageResponse<ReviewResponse> getAllReviewsForStaff(Pageable pageable);

    /**
     * Nhân viên hoặc Admin phản hồi đánh giá khách hàng
     */
    ReviewResponse replyReview(Long reviewId, StaffReplyReviewRequest request, Long staffId);

    /**
     * Admin ẩn/hiện đánh giá vi phạm
     */
    ReviewResponse toggleHideReview(Long reviewId, boolean isHidden);
}

