package com.kasicircle.backend.notifications.controller;

import com.kasicircle.backend.notifications.domain.NotificationType;
import com.kasicircle.backend.notifications.dto.NotificationResponse;
import com.kasicircle.backend.notifications.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NotificationService notificationService;

    @Test
    @WithAnonymousUser
    void notificationEndpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/notifications")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/notifications/unread-count")).andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/notifications/{id}/read", UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@example.com")
    void returnsPrivateNotificationsAndUnreadCount() throws Exception {
        NotificationResponse notification = notification();
        PageRequest pageable = PageRequest.of(0, 20);
        when(notificationService.getNotifications(any())).thenReturn(
                new PageImpl<>(List.of(notification), pageable, 1));
        when(notificationService.getUnreadCount()).thenReturn(1L);

        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("New message"))
                .andExpect(jsonPath("$.content[0].email").doesNotExist());
        mockMvc.perform(get("/api/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1));
    }

    @Test
    @WithMockUser(username = "user@example.com")
    void marksNotificationRead() throws Exception {
        UUID notificationId = UUID.randomUUID();
        when(notificationService.markAsRead(notificationId)).thenReturn(notification());

        mockMvc.perform(patch("/api/notifications/{id}/read", notificationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("MESSAGE"));

        verify(notificationService).markAsRead(notificationId);
    }

    private NotificationResponse notification() {
        return new NotificationResponse(
                UUID.randomUUID(), NotificationType.MESSAGE, "New message", "You received a new message.",
                "CONVERSATION", UUID.randomUUID(), Instant.parse("2026-01-01T10:00:00Z"), null);
    }
}
