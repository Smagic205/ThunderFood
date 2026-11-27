package com.thunderfood.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.review.ReviewResponse;
import com.thunderfood.backend.dto.review.StaffReplyReviewRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class StaffReviewControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ReviewService reviewService;

    @InjectMocks
    private StaffReviewController staffReviewController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(staffReviewController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        User staff = User.builder().id(2L).email("staff@tf.vn").role(Role.builder().id(2).name("STAFF").build()).build();
        UserDetailsImpl details = new UserDetailsImpl(staff);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("StaffReviewController getAllReviews, replyReview và toggleHideReview")
    void staffReviewEndpoints() throws Exception {
        when(reviewService.getAllReviewsForStaff(any(Pageable.class)))
                .thenReturn(PageResponse.<ReviewResponse>builder()
                        .content(List.of())
                        .pagination(PaginationInfo.builder().page(0).size(15).totalElements(0).totalPages(0).build())
                        .build());
        when(reviewService.replyReview(eq(1L), any(StaffReplyReviewRequest.class), eq(2L)))
                .thenReturn(ReviewResponse.builder().id(1L).staffReply("Cảm ơn quý khách").build());
        when(reviewService.toggleHideReview(1L, true))
                .thenReturn(ReviewResponse.builder().id(1L).isHidden(true).build());

        mockMvc.perform(get("/api/v1/staff/reviews"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/staff/reviews/1/reply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new StaffReplyReviewRequest("Cảm ơn quý khách"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.staffReply", is("Cảm ơn quý khách")));

        mockMvc.perform(patch("/api/v1/staff/reviews/1/hide").param("isHidden", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isHidden", is(true)));
    }
}
