package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.notification.NotificationResponse;
import com.thunderfood.backend.entity.Notification;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.NotificationRepository;
import com.thunderfood.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getUserNotifications(Long userId, Pageable pageable) {
        Page<Notification> notifPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        List<NotificationResponse> content = notifPage.getContent().stream()
                .map(NotificationResponse::fromEntity)
                .toList();

        PaginationInfo pagination = PaginationInfo.builder()
                .page(notifPage.getNumber())
                .size(notifPage.getSize())
                .totalElements(notifPage.getTotalElements())
                .totalPages(notifPage.getTotalPages())
                .hasNext(notifPage.hasNext())
                .hasPrevious(notifPage.hasPrevious())
                .build();

        return PageResponse.<NotificationResponse>builder()
                .content(content)
                .pagination(pagination)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo với ID: " + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền thao tác trên thông báo này");
        }

        notification.setIsRead(true);
        Notification saved = notificationRepository.save(notification);
        return NotificationResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
        log.info("Đã đánh dấu đã đọc tất cả thông báo cho user ID {}", userId);
    }

    @Override
    @Transactional
    public void sendNotification(User user, String title, String content, String type) {
        if (user == null) {
            return;
        }

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .content(content)
                .type(type != null ? type : "SYSTEM")
                .isRead(false)
                .build();

        notificationRepository.save(notification);
        log.info("Đã gửi thông báo [{}] đến user {}: {}", type, user.getId(), title);
    }
}

