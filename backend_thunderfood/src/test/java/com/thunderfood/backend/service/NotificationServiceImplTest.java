package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.notification.NotificationResponse;
import com.thunderfood.backend.entity.Notification;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.repository.NotificationRepository;
import com.thunderfood.backend.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    @Test
    @DisplayName("getUserNotifications và getUnreadCount trả về đúng dữ liệu phân trang")
    void getUserNotificationsAndUnreadCount() {
        User u = User.builder().id(1L).build();
        Notification n = Notification.builder()
                .id(10L)
                .user(u)
                .title("Đơn mới")
                .content("Đang giao")
                .type("ORDER")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L, PageRequest.of(0, 10)))
                .thenReturn(new PageImpl<>(List.of(n)));
        when(notificationRepository.countByUserIdAndIsReadFalse(1L)).thenReturn(3L);

        PageResponse<NotificationResponse> page = notificationService.getUserNotifications(1L, PageRequest.of(0, 10));
        assertEquals(1, page.getContent().size());
        assertEquals(3L, notificationService.getUnreadCount(1L));
    }

    @Test
    @DisplayName("markAsRead chặn đánh dấu thông báo thuộc người dùng khác")
    void markAsRead_RejectsOtherUser() {
        User owner = User.builder().id(1L).build();
        Notification n = Notification.builder().id(5L).user(owner).isRead(false).build();
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(n));

        assertThrows(IllegalArgumentException.class, () -> notificationService.markAsRead(5L, 999L));
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("markAllAsRead và sendNotification hoạt động bình thường")
    void markAllAsReadAndSendNotification() {
        User u = User.builder().id(2L).build();
        notificationService.markAllAsRead(2L);
        verify(notificationRepository).markAllAsReadByUserId(2L);

        notificationService.sendNotification(u, "Tiêu đề", "Nội dung", null);
        verify(notificationRepository).save(any(Notification.class));

        notificationService.sendNotification(null, "Bỏ qua", "Nội dung", "SYSTEM");
        verifyNoMoreInteractions(notificationRepository);
    }
}
