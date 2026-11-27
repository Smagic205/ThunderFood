package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.review.CreateReviewRequest;
import com.thunderfood.backend.dto.review.ReviewResponse;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.ReviewService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ReviewControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ReviewService reviewService;

    @InjectMocks
    private ReviewController reviewController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reviewController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        User u = User.builder().id(1L).email("u@tf.vn").role(Role.builder().id(1).name("CUSTOMER").build()).build();
        UserDetailsImpl details = new UserDetailsImpl(u);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("POST /api/v1/reviews và GET /product/{productId} hoạt động đúng")
    void createAndGetReviews() throws Exception {
        CreateReviewRequest req = CreateReviewRequest.builder()
                .productId(10L)
                .orderId(20L)
                .rating((short) 5)
                .comment("Rất ngon")
                .build();
        when(reviewService.createReview(eq(1L), any(CreateReviewRequest.class)))
                .thenReturn(ReviewResponse.builder().id(1L).rating((short) 5).build());
        when(reviewService.getProductReviews(eq(10L), any(Pageable.class)))
                .thenReturn(PageResponse.<ReviewResponse>builder()
                        .content(List.of())
                        .pagination(PaginationInfo.builder().page(0).size(10).totalElements(0).totalPages(0).build())
                        .build());

        mockMvc.perform(post("/api/v1/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.rating", is(5)));

        mockMvc.perform(get("/api/v1/reviews/product/10"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/v1/reviews trả về 400 khi rating vượt ngoài khoảng 1-5")
    void createReview_InvalidRating_ReturnsBadRequest() throws Exception {
        CreateReviewRequest invalid = CreateReviewRequest.builder()
                .productId(10L)
                .orderId(20L)
                .rating((short) 6)
                .build();

        mockMvc.perform(post("/api/v1/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
