package com.kasicircle.backend.messaging.service;

import com.kasicircle.backend.messaging.domain.Conversation;
import com.kasicircle.backend.messaging.domain.ConversationMessage;
import com.kasicircle.backend.messaging.dto.CreateConversationRequest;
import com.kasicircle.backend.messaging.dto.SendMessageRequest;
import com.kasicircle.backend.messaging.repository.ConversationMessageRepository;
import com.kasicircle.backend.messaging.repository.ConversationRepository;
import com.kasicircle.backend.notifications.domain.NotificationType;
import com.kasicircle.backend.notifications.service.NotificationService;
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
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ConversationMessageRepository messageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    private ConversationServiceImpl service;
    private final User currentUser = User.builder()
            .id(UUID.fromString("00000000-0000-0000-0000-000000000001"))
            .firstName("Thando").lastName("Mokoena").email("current@example.com").build();
    private final User otherUser = User.builder()
            .id(UUID.fromString("00000000-0000-0000-0000-000000000002"))
            .firstName("Amahle").lastName("Dube").email("other@example.com").build();
    private final UUID conversationId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new ConversationServiceImpl(
                conversationRepository, messageRepository, userRepository, notificationService);
        authenticate(currentUser.getEmail());
        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(Optional.of(currentUser));
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void reusesExistingConversationAndReturnsOnlyOtherParticipantPublicFields() {
        Conversation conversation = conversation();
        when(userRepository.findById(otherUser.getId())).thenReturn(Optional.of(otherUser));
        when(conversationRepository.findByParticipantOneIdAndParticipantTwoId(
                currentUser.getId(), otherUser.getId())).thenReturn(Optional.of(conversation));

        var result = service.createConversation(new CreateConversationRequest(otherUser.getId()));

        assertEquals(conversationId, result.id());
        assertEquals(otherUser.getId(), result.participantId());
        assertEquals("Amahle Dube", result.participantName());
        verify(conversationRepository, never()).save(any(Conversation.class));
    }

    @Test
    void rejectsStartingConversationWithSelf() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.createConversation(new CreateConversationRequest(currentUser.getId())));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verify(userRepository, never()).findById(any());
    }

    @Test
    void deniesHistoryAccessToNonParticipants() {
        User stranger = User.builder().id(UUID.randomUUID()).email("stranger@example.com").build();
        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(Optional.of(stranger));
        when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation()));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.getMessages(conversationId, PageRequest.of(0, 50)));
        ResponseStatusException sendError = assertThrows(ResponseStatusException.class,
                () -> service.sendMessage(conversationId, new SendMessageRequest("Intrusive message")));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN, sendError.getStatusCode());
        verify(messageRepository, never()).findByConversationId(any(), any());
        verify(messageRepository, never()).save(any(ConversationMessage.class));
        verify(notificationService, never()).createNotification(any(), any(), any(), any(), any(), any());
    }

    @Test
    void onlyParticipantsCanSendAndMessagesAreTrimmed() {
        Conversation conversation = conversation();
        when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(ConversationMessage.class))).thenAnswer(invocation -> {
            ConversationMessage message = invocation.getArgument(0);
            message.setId(UUID.randomUUID());
            message.setCreatedAt(Instant.parse("2026-01-01T10:00:00Z"));
            return message;
        });

        var result = service.sendMessage(conversationId, new SendMessageRequest("  Hello there.  "));

        assertEquals("Hello there.", result.content());
        assertEquals(currentUser.getId(), result.senderId());
        assertEquals("Thando Mokoena", result.senderName());
        verify(notificationService).createNotification(
                otherUser.getId(), NotificationType.MESSAGE, "New message",
                "Thando Mokoena sent you a message.", "CONVERSATION", conversationId);
        verify(conversationRepository).save(conversation);
    }

    @Test
    void returnsChronologicalHistoryOnlyAfterCheckingMembership() {
        Conversation conversation = conversation();
        ConversationMessage message = new ConversationMessage();
        message.setId(UUID.randomUUID());
        message.setConversation(conversation);
        message.setSender(otherUser);
        message.setContent("Hello");
        message.setCreatedAt(Instant.parse("2026-01-01T10:00:00Z"));
        when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
        when(messageRepository.findByConversationId(
                conversationId, PageRequest.of(0, 50)))
                .thenReturn(new PageImpl<>(List.of(message), PageRequest.of(0, 50), 1));

        var result = service.getMessages(conversationId, PageRequest.of(0, 50));

        assertEquals(1, result.getTotalElements());
        assertEquals("Amahle Dube", result.getContent().get(0).senderName());
        assertEquals("Hello", result.getContent().get(0).content());
    }

    private Conversation conversation() {
        Conversation result = new Conversation();
        result.setId(conversationId);
        result.setParticipantOne(currentUser);
        result.setParticipantTwo(otherUser);
        result.setUpdatedAt(Instant.parse("2026-01-01T10:00:00Z"));
        return result;
    }

    private void authenticate(String email) {
        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername(email).password("unused").roles("USER").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }
}
