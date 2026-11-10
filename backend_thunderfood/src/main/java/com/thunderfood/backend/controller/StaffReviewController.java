package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.SecurityUtils;
import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.review.ReviewResponse;
import com.thunderfood.backend.dto.review.StaffReplyReviewRequest;
import com.thunderfood.backend.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/staff/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
@Tag(name = "Staff Review Controller", description = "Quản lý và phản hồi đánh giá khách hàng dành cho Nhân viên và Admin")
public class StaffReviewController {

    private final ReviewService reviewService;

    @GetMapping
    @Operation(summary = "Nhân viên/Admin xem toàn bộ danh sách đánh giá của khách hàng")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<ReviewResponse> response = reviewService.getAllReviewsForStaff(pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đánh giá thành công", response));
    }

    @PostMapping("/{id}/reply")
    @Operation(summary = "Nhân viên hoặc Admin gửi câu trả lời phản hồi đánh giá của khách hàng")
    public ResponseEntity<ApiResponse<ReviewResponse>> replyReview(
            @PathVariable Long id,
            @Valid @RequestBody StaffReplyReviewRequest request
    ) {
        Long staffId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new AccessDeniedException("Vui lòng đăng nhập để phản hồi"));
        ReviewResponse response = reviewService.replyReview(id, request, staffId);
        return ResponseEntity.ok(ApiResponse.success("Gửi phản hồi đánh giá thành công", response));
    }

    @PatchMapping("/{id}/hide")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin ẩn hoặc hiện đánh giá vi phạm tiêu chuẩn cộng đồng")
    public ResponseEntity<ApiResponse<ReviewResponse>> toggleHideReview(
            @PathVariable Long id,
            @RequestParam boolean isHidden
    ) {
        ReviewResponse response = reviewService.toggleHideReview(id, isHidden);
        String msg = isHidden ? "Đã ẩn đánh giá khỏi cửa hàng" : "Đã bỏ ẩn đánh giá";
        return ResponseEntity.ok(ApiResponse.success(msg, response));
    }
}

