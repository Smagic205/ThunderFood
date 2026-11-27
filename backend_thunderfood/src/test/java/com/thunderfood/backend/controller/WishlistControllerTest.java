package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.wishlist.WishlistItemResponse;
import com.thunderfood.backend.dto.wishlist.WishlistToggleResponse;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.WishlistService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
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
class WishlistControllerTest {

    private MockMvc mockMvc;

    @Mock
    private WishlistService wishlistService;

    @InjectMocks
    private WishlistController wishlistController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(wishlistController)
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
    @DisplayName("WishlistController toggle, check và getMyWishlist trả về 200")
    void wishlistEndpoints() throws Exception {
        when(wishlistService.toggleWishlist(1L, 10L))
                .thenReturn(WishlistToggleResponse.builder().productId(10L).isWishlist(true).message("Đã thêm").build());
        when(wishlistService.isWishlisted(1L, 10L)).thenReturn(true);
        when(wishlistService.getMyWishlist(eq(1L), any(Pageable.class)))
                .thenReturn(PageResponse.<WishlistItemResponse>builder()
                        .content(List.of())
                        .pagination(PaginationInfo.builder().page(0).size(12).totalElements(0).totalPages(0).build())
                        .build());

        mockMvc.perform(post("/api/v1/wishlists/toggle/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isWishlist", is(true)));

        mockMvc.perform(get("/api/v1/wishlists/check/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", is(true)));

        mockMvc.perform(get("/api/v1/wishlists"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
