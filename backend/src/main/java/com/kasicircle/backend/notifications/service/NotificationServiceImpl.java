package com.kasicircle.backend.notifications.service;

import com.kasicircle.backend.notifications.domain.Notification;
import com.kasicircle.backend.notifications.domain.NotificationType;
import com.kasicircle.backend.notifications.dto.NotificationResponse;
import com.kasicircle.backend.notifications.repository.NotificationRepository;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.exception.UserNotFoundException;
import com.kasicircle.backend.users.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(Pageable pageable) {
        User recipient = getCurrentUser();
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipient.getId(), pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount() {
        return notificationRepository.countByRecipientIdAndReadAtIsNull(getCurrentUser().getId());
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID notificationId) {
        User recipient = getCurrentUser();
        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, recipient.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found."));
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
        }
        return toResponse(notification);
    }

    @Override
    @Transactional
    public void createNotification(
            UUID recipientId,
            NotificationType type,
            String title,
            String message,
            String resourceType,
            UUID resourceId
    ) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new UserNotFoundException("User with ID " + recipientId + " not found."));
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setResourceType(resourceType);
        notification.setResourceId(resourceId);
        notificationRepository.save(notification);
    }

    private User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();
        String email = principal instanceof UserDetails details ? details.getUsername() : principal.toString();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User with email " + email + " not found."));
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getResourceType(),
                notification.getResourceId(),
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }
}
