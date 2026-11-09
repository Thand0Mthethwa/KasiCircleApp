package com.kasicircle.backend.workers.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kasicircle.backend.workers.dto.WorkerProfileRequest;
import com.kasicircle.backend.workers.dto.WorkerProfileResponse;
import com.kasicircle.backend.workers.service.WorkerProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WorkerProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private WorkerProfileService workerProfileService;

    @Test
    @WithAnonymousUser
    void publicDirectoryIsAccessibleAndExcludesPrivateContactFields() throws Exception {
        WorkerProfileResponse response = profileResponse();
        when(workerProfileService.searchPublicProfiles(eq(null), eq(null), eq(null), eq(null), any()))
                .thenReturn(new PageImpl<>(java.util.List.of(response), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/workers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].displayName").value("Amahle Dube"))
                .andExpect(jsonPath("$.content[0].email").doesNotExist())
                .andExpect(jsonPath("$.content[0].phoneNumber").doesNotExist());
    }

    @Test
    @WithAnonymousUser
    void ownProfileRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/workers/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithAnonymousUser
    void publicProfileCanBeViewedWithoutAuthentication() throws Exception {
        UUID profileId = UUID.randomUUID();
        when(workerProfileService.getPublicProfile(profileId)).thenReturn(profileResponse());

        mockMvc.perform(get("/api/workers/{id}", profileId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headline").value("Qualified Electrician"));
    }

    @Test
    @WithMockUser(username = "worker@example.com")
    void profileCreationValidatesFieldsAndReturnsCreated() throws Exception {
        WorkerProfileRequest request = new WorkerProfileRequest(
                "Electrician", "Home wiring", Set.of("Wiring"), Set.of("Electrical"), "Soweto", "Gauteng");
        when(workerProfileService.createMyProfile(any())).thenReturn(profileResponse());

        mockMvc.perform(post("/api/workers/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.displayName").value("Amahle Dube"));
    }

    @Test
    @WithMockUser(username = "worker@example.com")
    void profileUpdateReturnsUpdatedProfile() throws Exception {
        WorkerProfileRequest request = new WorkerProfileRequest(
                "Electrician", "Home wiring", Set.of("Wiring"), Set.of("Electrical"), "Soweto", "Gauteng");
        when(workerProfileService.updateMyProfile(any())).thenReturn(profileResponse());

        mockMvc.perform(put("/api/workers/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headline").value("Qualified Electrician"));
    }

    @Test
    @WithMockUser(username = "worker@example.com")
    void invalidProfileIsRejectedBeforeServiceCall() throws Exception {
        WorkerProfileRequest request = new WorkerProfileRequest(
                "", "Home wiring", Set.of(), Set.of("Electrical"), "Soweto", "Gauteng");

        mockMvc.perform(put("/api/workers/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        org.mockito.Mockito.verifyNoInteractions(workerProfileService);
    }

    private WorkerProfileResponse profileResponse() {
        return new WorkerProfileResponse(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Amahle Dube",
                "Qualified Electrician",
                "Home and business wiring",
                Set.of("Wiring"),
                Set.of("Electrical"),
                "Soweto",
                "Gauteng",
                null,
                null
        );
    }
}
