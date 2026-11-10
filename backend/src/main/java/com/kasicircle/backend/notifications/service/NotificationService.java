package com.kasicircle.backend.notifications.service;

import com.kasicircle.backend.notifications.domain.NotificationType;
import com.kasicircle.backend.notifications.dto.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {

    Page<NotificationResponse> getNotifications(Pageable pageable);

    long getUnreadCount();

    NotificationResponse markAsRead(UUID notificationId);

    void createNotification(
            UUID recipientId,
            NotificationType type,
            String title,
            String message,
            String resourceType,
            UUID resourceId
    );
}
