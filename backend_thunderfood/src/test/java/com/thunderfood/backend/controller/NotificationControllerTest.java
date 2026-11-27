package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.notification.NotificationResponse;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.NotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController notificationController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificationController)
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
    @DisplayName("GET /api/v1/notifications giới hạn size tối đa 50 và gọi mark-all/unread-count")
    void notificationsEndpointsAndPageSizeCap() throws Exception {
        PageResponse<NotificationResponse> page = PageResponse.<NotificationResponse>builder()
                .content(List.of(NotificationResponse.builder().id(1L).title("Thông báo").build()))
                .pagination(PaginationInfo.builder().page(0).size(50).totalElements(1).totalPages(1).build())
                .build();

        when(notificationService.getUserNotifications(eq(1L), any(Pageable.class))).thenReturn(page);
        when(notificationService.getUnreadCount(1L)).thenReturn(2L);

        mockMvc.perform(get("/api/v1/notifications").param("size", "999999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title", is("Thông báo")));

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(notificationService).getUserNotifications(eq(1L), pageableCaptor.capture());
        assertEquals(50, pageableCaptor.getValue().getPageSize());

        mockMvc.perform(get("/api/v1/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", is(2)));

        mockMvc.perform(patch("/api/v1/notifications/read-all"))
                .andExpect(status().isOk());
    }
}
