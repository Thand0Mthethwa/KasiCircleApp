package com.kasicircle.backend.messaging.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kasicircle.backend.messaging.dto.ConversationResponse;
import com.kasicircle.backend.messaging.dto.CreateConversationRequest;
import com.kasicircle.backend.messaging.dto.SendMessageRequest;
import com.kasicircle.backend.messaging.service.ConversationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ConversationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ConversationService conversationService;

    @Test
    @WithAnonymousUser
    void conversationListRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/conversations"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithAnonymousUser
    void messagesRequireAuthentication() throws Exception {
        mockMvc.perform(post("/api/conversations/{id}/messages", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SendMessageRequest("Hello"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@example.com")
    void authenticatedUserCanListTheirConversations() throws Exception {
        when(conversationService.getConversations()).thenReturn(List.of(
                new ConversationResponse(UUID.randomUUID(), UUID.randomUUID(), "Other User", null)));

        mockMvc.perform(get("/api/conversations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].participantName").value("Other User"))
                .andExpect(jsonPath("$[0].email").doesNotExist());
    }

    @Test
    @WithMockUser(username = "user@example.com")
    void validatesMessagesBeforeSending() throws Exception {
        mockMvc.perform(post("/api/conversations/{id}/messages", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SendMessageRequest("   "))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user@example.com")
    void authenticatedUserCanStartConversation() throws Exception {
        UUID participantId = UUID.randomUUID();
        ConversationResponse response = new ConversationResponse(
                UUID.randomUUID(), participantId, "Other User", null);
        when(conversationService.createConversation(any(CreateConversationRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/conversations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateConversationRequest(participantId))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.participantId").value(participantId.toString()));

        verify(conversationService).createConversation(new CreateConversationRequest(participantId));
    }
}
