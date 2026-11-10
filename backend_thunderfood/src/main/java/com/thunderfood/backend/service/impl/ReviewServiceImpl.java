package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.review.CreateReviewRequest;
import com.thunderfood.backend.dto.review.ReviewResponse;
import com.thunderfood.backend.dto.review.StaffReplyReviewRequest;
import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.entity.Product;
import com.thunderfood.backend.entity.Review;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.ConflictException;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.OrderRepository;
import com.thunderfood.backend.repository.ProductRepository;
import com.thunderfood.backend.repository.ReviewRepository;
import com.thunderfood.backend.repository.UserRepository;
import com.thunderfood.backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ReviewResponse createReview(Long userId, CreateReviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + request.getProductId()));

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + request.getOrderId()));

        // Ràng buộc 1: Đơn hàng phải thuộc về user này
        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Bạn chỉ có thể đánh giá đơn hàng của chính mình");
        }

        // Ràng buộc 2: Đơn hàng phải có trạng thái DELIVERED
        if (!"DELIVERED".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalArgumentException("Chỉ có thể đánh giá món ăn sau khi đơn hàng đã giao thành công (DELIVERED)");
        }

        // Ràng buộc 3: Món ăn phải có trong đơn hàng này
        boolean itemExists = order.getItems().stream()
                .anyMatch(item -> item.getProduct() != null && item.getProduct().getId().equals(product.getId()));
        if (!itemExists) {
            throw new IllegalArgumentException("Món ăn này không thuộc đơn hàng " + order.getOrderCode());
        }

        // Ràng buộc 4: Mỗi món trong một đơn chỉ được đánh giá 1 lần
        if (reviewRepository.existsByUserIdAndProductIdAndOrderId(userId, product.getId(), order.getId())) {
            throw new ConflictException("Bạn đã đánh giá món ăn này trong đơn hàng " + order.getOrderCode() + " rồi");
        }

        Review review = Review.builder()
                .product(product)
                .user(user)
                .order(order)
                .rating(request.getRating())
                .comment(request.getComment() != null ? request.getComment().trim() : null)
                .imageUrl(request.getImageUrl() != null && !request.getImageUrl().isBlank() ? request.getImageUrl().trim() : null)
                .isHidden(false)
                .build();

        Review savedReview = reviewRepository.save(review);
        log.info("User {} đã đánh giá sản phẩm {}: {} sao", user.getEmail(), product.getName(), request.getRating());

        // Cập nhật lại avg_rating của sản phẩm
        updateProductAvgRating(product.getId());

        return ReviewResponse.fromEntity(savedReview);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getProductReviews(Long productId, Pageable pageable) {
        Page<Review> reviewPage = reviewRepository.findByProductIdAndIsHiddenFalseOrderByCreatedAtDesc(productId, pageable);

        List<ReviewResponse> content = reviewPage.getContent().stream()
                .map(ReviewResponse::fromEntity)
                .toList();

        PaginationInfo pagination = PaginationInfo.builder()
                .page(reviewPage.getNumber())
                .size(reviewPage.getSize())
                .totalElements(reviewPage.getTotalElements())
                .totalPages(reviewPage.getTotalPages())
                .hasNext(reviewPage.hasNext())
                .hasPrevious(reviewPage.hasPrevious())
                .build();

        return PageResponse.<ReviewResponse>builder()
                .content(content)
                .pagination(pagination)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getAllReviewsForStaff(Pageable pageable) {
        Page<Review> reviewPage = reviewRepository.findAllByOrderByCreatedAtDesc(pageable);

        List<ReviewResponse> content = reviewPage.getContent().stream()
                .map(ReviewResponse::fromEntity)
                .toList();

        PaginationInfo pagination = PaginationInfo.builder()
                .page(reviewPage.getNumber())
                .size(reviewPage.getSize())
                .totalElements(reviewPage.getTotalElements())
                .totalPages(reviewPage.getTotalPages())
                .hasNext(reviewPage.hasNext())
                .hasPrevious(reviewPage.hasPrevious())
                .build();

        return PageResponse.<ReviewResponse>builder()
                .content(content)
                .pagination(pagination)
                .build();
    }

    @Override
    @Transactional
    public ReviewResponse replyReview(Long reviewId, StaffReplyReviewRequest request, Long staffId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá với ID: " + reviewId));

        User staffUser = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + staffId));

        review.setStaffReply(request.getReply().trim());
        review.setRepliedByStaff(staffUser);
        review.setRepliedAt(LocalDateTime.now());

        Review savedReview = reviewRepository.save(review);
        log.info("Nhân viên {} đã phản hồi đánh giá ID {}", staffUser.getFullName(), reviewId);

        return ReviewResponse.fromEntity(savedReview);
    }

    @Override
    @Transactional
    public ReviewResponse toggleHideReview(Long reviewId, boolean isHidden) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá với ID: " + reviewId));

        review.setIsHidden(isHidden);
        Review savedReview = reviewRepository.save(review);

        // Cập nhật lại avg_rating nếu ẩn/hiện
        updateProductAvgRating(review.getProduct().getId());

        log.info("Admin đã cập nhật ẩn đánh giá ID {}: isHidden={}", reviewId, isHidden);
        return ReviewResponse.fromEntity(savedReview);
    }

    private void updateProductAvgRating(Long productId) {
        Double avg = reviewRepository.calculateAverageRatingByProductId(productId);
        productRepository.findById(productId).ifPresent(p -> {
            if (avg != null) {
                p.setAvgRating(BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP));
            } else {
                p.setAvgRating(BigDecimal.ZERO);
            }
            productRepository.save(p);
        });
    }
}

