package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.review.CreateReviewRequest;
import com.thunderfood.backend.dto.review.ReviewResponse;
import com.thunderfood.backend.dto.review.StaffReplyReviewRequest;
import com.thunderfood.backend.entity.*;
import com.thunderfood.backend.exception.ConflictException;
import com.thunderfood.backend.repository.OrderRepository;
import com.thunderfood.backend.repository.ProductRepository;
import com.thunderfood.backend.repository.ReviewRepository;
import com.thunderfood.backend.repository.UserRepository;
import com.thunderfood.backend.service.impl.ReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private User customer;
    private Product product;
    private Order deliveredOrder;

    @BeforeEach
    void setUp() {
        customer = User.builder().id(1L).fullName("Khách").email("k@gmail.com").build();
        product = Product.builder().id(10L).name("Cơm gà").avgRating(BigDecimal.ZERO).build();
        deliveredOrder = Order.builder()
                .id(20L)
                .orderCode("TF20")
                .user(customer)
                .status("DELIVERED")
                .items(List.of(OrderItem.builder().product(product).build()))
                .build();
    }

    @Test
    @DisplayName("createReview thành công cho đơn DELIVERED và cập nhật avgRating sản phẩm")
    void createReview_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(orderRepository.findById(20L)).thenReturn(Optional.of(deliveredOrder));
        when(reviewRepository.existsByUserIdAndProductIdAndOrderId(1L, 10L, 20L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> {
            Review r = inv.getArgument(0);
            r.setId(5L);
            return r;
        });
        when(reviewRepository.calculateAverageRatingByProductId(10L)).thenReturn(4.5);

        CreateReviewRequest req = CreateReviewRequest.builder()
                .productId(10L)
                .orderId(20L)
                .rating((short) 5)
                .comment("Ngon")
                .build();

        ReviewResponse res = reviewService.createReview(1L, req);

        assertEquals(5L, res.getId());
        assertEquals(new BigDecimal("4.5"), product.getAvgRating());
        verify(productRepository).save(product);
    }

    @Test
    @DisplayName("createReview chặn đánh giá trùng lặp trên cùng (user, product, order)")
    void createReview_Duplicate_ThrowsConflict() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(orderRepository.findById(20L)).thenReturn(Optional.of(deliveredOrder));
        when(reviewRepository.existsByUserIdAndProductIdAndOrderId(1L, 10L, 20L)).thenReturn(true);

        CreateReviewRequest req = CreateReviewRequest.builder().productId(10L).orderId(20L).rating((short) 5).build();
        assertThrows(ConflictException.class, () -> reviewService.createReview(1L, req));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("replyReview và toggleHideReview cập nhật phản hồi và tính lại avgRating")
    void replyAndToggleHideReview() {
        User staff = User.builder().id(9L).fullName("Staff").build();
        Review review = Review.builder().id(5L).user(customer).product(product).order(deliveredOrder).rating((short) 5).isHidden(false).build();

        when(reviewRepository.findById(5L)).thenReturn(Optional.of(review));
        when(userRepository.findById(9L)).thenReturn(Optional.of(staff));
        when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(reviewRepository.calculateAverageRatingByProductId(10L)).thenReturn(null);
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        ReviewResponse replied = reviewService.replyReview(5L, StaffReplyReviewRequest.builder().reply("Cảm ơn bạn").build(), 9L);
        assertEquals("Cảm ơn bạn", replied.getStaffReply());

        ReviewResponse hidden = reviewService.toggleHideReview(5L, true);
        assertTrue(hidden.getIsHidden());
        assertEquals(BigDecimal.ZERO, product.getAvgRating());
    }
}
