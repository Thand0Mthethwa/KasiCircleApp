package com.kasicircle.backend.notifications.service;

import com.kasicircle.backend.notifications.domain.Notification;
import com.kasicircle.backend.notifications.domain.NotificationType;
import com.kasicircle.backend.notifications.repository.NotificationRepository;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    private NotificationServiceImpl service;
    private final UUID userId = UUID.randomUUID();
    private final UUID notificationId = UUID.randomUUID();
    private final User recipient = User.builder().id(userId).firstName("Thando").lastName("Mokoena")
            .email("recipient@example.com").build();

    @BeforeEach
    void setUp() {
        service = new NotificationServiceImpl(notificationRepository, userRepository);
        authenticate(recipient.getEmail());
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listsOnlyTheCurrentUsersNotificationsAndUnreadCount() {
        Notification notification = notification(false);
        PageRequest pageable = PageRequest.of(0, 20);
        when(userRepository.findByEmail(recipient.getEmail())).thenReturn(Optional.of(recipient));
        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable))
                .thenReturn(new PageImpl<>(List.of(notification), pageable, 1));
        when(notificationRepository.countByRecipientIdAndReadAtIsNull(userId)).thenReturn(1L);

        var result = service.getNotifications(pageable);
        long unreadCount = service.getUnreadCount();

        assertEquals(1, result.getTotalElements());
        assertEquals(notificationId, result.getContent().get(0).id());
        assertEquals(1L, unreadCount);
        verify(notificationRepository).findByRecipientIdOrderByCreatedAtDesc(userId, pageable);
        verify(notificationRepository).countByRecipientIdAndReadAtIsNull(userId);
    }

    @Test
    void marksOwnedNotificationAsRead() {
        Notification notification = notification(false);
        when(userRepository.findByEmail(recipient.getEmail())).thenReturn(Optional.of(recipient));
        when(notificationRepository.findByIdAndRecipientId(notificationId, userId))
                .thenReturn(Optional.of(notification));
        when(notificationRepository.save(notification)).thenReturn(notification);

        var result = service.markAsRead(notificationId);

        assertNotNull(result.readAt());
        verify(notificationRepository).save(notification);
    }

    @Test
    void doesNotAllowMarkingAnotherUsersNotificationAsRead() {
        when(userRepository.findByEmail(recipient.getEmail())).thenReturn(Optional.of(recipient));
        when(notificationRepository.findByIdAndRecipientId(notificationId, userId))
                .thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> service.markAsRead(notificationId));

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void notificationCreationStoresOnlyTheSelectedRecipientAndResource() {
        UUID jobId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.of(recipient));

        service.createNotification(
                userId, NotificationType.JOB_APPLICATION, "New job application",
                "A resident applied.", "JOB", jobId);

        org.mockito.ArgumentCaptor<Notification> captor = org.mockito.ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertEquals(userId, captor.getValue().getRecipient().getId());
        assertEquals(NotificationType.JOB_APPLICATION, captor.getValue().getType());
        assertEquals(jobId, captor.getValue().getResourceId());
    }

    private Notification notification(boolean read) {
        Notification result = new Notification();
        result.setId(notificationId);
        result.setRecipient(recipient);
        result.setType(NotificationType.MESSAGE);
        result.setTitle("New message");
        result.setMessage("You received a new message.");
        result.setResourceType("CONVERSATION");
        result.setResourceId(UUID.randomUUID());
        result.setCreatedAt(Instant.parse("2026-01-01T10:00:00Z"));
        if (read) result.setReadAt(Instant.parse("2026-01-01T10:01:00Z"));
        return result;
    }

    private void authenticate(String email) {
        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername(email).password("unused").roles("USER").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }
}
