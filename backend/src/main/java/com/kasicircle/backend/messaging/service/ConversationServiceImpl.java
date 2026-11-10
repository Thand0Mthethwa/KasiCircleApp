package com.kasicircle.backend.messaging.service;

import com.kasicircle.backend.messaging.domain.Conversation;
import com.kasicircle.backend.messaging.domain.ConversationMessage;
import com.kasicircle.backend.messaging.dto.ConversationMessageResponse;
import com.kasicircle.backend.messaging.dto.ConversationResponse;
import com.kasicircle.backend.messaging.dto.CreateConversationRequest;
import com.kasicircle.backend.messaging.dto.SendMessageRequest;
import com.kasicircle.backend.messaging.repository.ConversationMessageRepository;
import com.kasicircle.backend.messaging.repository.ConversationRepository;
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
import java.util.List;
import java.util.UUID;

@Service
public class ConversationServiceImpl implements ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationMessageRepository messageRepository;
    private final UserRepository userRepository;

    public ConversationServiceImpl(
            ConversationRepository conversationRepository,
            ConversationMessageRepository messageRepository,
            UserRepository userRepository
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations() {
        User currentUser = getCurrentUser();
        return conversationRepository.findByParticipantOneIdOrParticipantTwoIdOrderByUpdatedAtDesc(
                        currentUser.getId(), currentUser.getId())
                .stream()
                .map(conversation -> toConversationResponse(conversation, currentUser.getId()))
                .toList();
    }

    @Override
    @Transactional
    public ConversationResponse createConversation(CreateConversationRequest request) {
        User currentUser = getCurrentUser();
        if (currentUser.getId().equals(request.participantId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot start a conversation with yourself.");
        }

        User otherParticipant = userRepository.findById(request.participantId())
                .orElseThrow(() -> new UserNotFoundException(
                        "User with ID " + request.participantId() + " not found."));
        User firstParticipant = currentUser.getId().compareTo(otherParticipant.getId()) < 0
                ? currentUser : otherParticipant;
        User secondParticipant = firstParticipant == currentUser ? otherParticipant : currentUser;

        Conversation conversation = conversationRepository.findByParticipantOneIdAndParticipantTwoId(
                        firstParticipant.getId(), secondParticipant.getId())
                .orElseGet(() -> {
                    Conversation created = new Conversation();
                    created.setParticipantOne(firstParticipant);
                    created.setParticipantTwo(secondParticipant);
                    return conversationRepository.save(created);
                });
        return toConversationResponse(conversation, currentUser.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationMessageResponse> getMessages(UUID conversationId, Pageable pageable) {
        User currentUser = getCurrentUser();
        Conversation conversation = getConversationForParticipant(conversationId, currentUser);
        return messageRepository.findByConversationId(conversation.getId(), pageable)
                .map(this::toMessageResponse);
    }

    @Override
    @Transactional
    public ConversationMessageResponse sendMessage(UUID conversationId, SendMessageRequest request) {
        User currentUser = getCurrentUser();
        Conversation conversation = getConversationForParticipant(conversationId, currentUser);

        ConversationMessage message = new ConversationMessage();
        message.setConversation(conversation);
        message.setSender(currentUser);
        message.setContent(request.content().trim());
        ConversationMessage savedMessage = messageRepository.save(message);

        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);
        return toMessageResponse(savedMessage);
    }

    private Conversation getConversationForParticipant(UUID conversationId, User user) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found."));
        if (!conversation.hasParticipant(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this conversation.");
        }
        return conversation;
    }

    private User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();
        String email = principal instanceof UserDetails details ? details.getUsername() : principal.toString();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User with email " + email + " not found."));
    }

    private ConversationResponse toConversationResponse(Conversation conversation, UUID currentUserId) {
        User otherParticipant = conversation.otherParticipant(currentUserId);
        return new ConversationResponse(
                conversation.getId(),
                otherParticipant.getId(),
                otherParticipant.getFirstName() + " " + otherParticipant.getLastName(),
                conversation.getUpdatedAt()
        );
    }

    private ConversationMessageResponse toMessageResponse(ConversationMessage message) {
        User sender = message.getSender();
        return new ConversationMessageResponse(
                message.getId(),
                sender.getId(),
                sender.getFirstName() + " " + sender.getLastName(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}