package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.notification.NotificationResponse;
import com.thunderfood.backend.entity.User;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    PageResponse<NotificationResponse> getUserNotifications(Long userId, Pageable pageable);

    long getUnreadCount(Long userId);

    NotificationResponse markAsRead(Long notificationId, Long userId);

    void markAllAsRead(Long userId);

    /**
     * Bắn thông báo nội bộ cho người dùng
     */
    void sendNotification(User user, String title, String content, String type);
}

