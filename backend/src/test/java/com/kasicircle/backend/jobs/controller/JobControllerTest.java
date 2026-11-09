package com.kasicircle.backend.jobs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kasicircle.backend.jobs.domain.ApplicationStatus;
import com.kasicircle.backend.jobs.domain.EmploymentType;
import com.kasicircle.backend.jobs.domain.JobStatus;
import com.kasicircle.backend.jobs.dto.JobApplicationRequest;
import com.kasicircle.backend.jobs.dto.JobApplicationResponse;
import com.kasicircle.backend.jobs.dto.JobApplicationStatusRequest;
import com.kasicircle.backend.jobs.dto.JobRequest;
import com.kasicircle.backend.jobs.dto.JobResponse;
import com.kasicircle.backend.jobs.dto.JobStatusRequest;
import com.kasicircle.backend.jobs.service.JobApplicationService;
import com.kasicircle.backend.jobs.service.JobService;
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

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class JobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private JobService jobService;

    @MockitoBean
    private JobApplicationService applicationService;

    @Test
    @WithAnonymousUser
    void publicJobDirectoryIsAccessible() throws Exception {
        when(jobService.searchJobs(eq(null), eq(null), eq(null), eq(null), any()))
                .thenReturn(new PageImpl<>(List.of(jobResponse()), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Electrician"))
                .andExpect(jsonPath("$.content[0].employerEmail").doesNotExist());
    }

    @Test
    @WithAnonymousUser
    void ownApplicationsArePrivate() throws Exception {
        mockMvc.perform(get("/api/jobs/me/applications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithAnonymousUser
    void employerApplicationListIsPrivate() throws Exception {
        mockMvc.perform(get("/api/jobs/{id}/applications", UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithAnonymousUser
    void applicationsCannotBeSubmittedAnonymously() throws Exception {
        mockMvc.perform(post("/api/jobs/{id}/applications", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new JobApplicationRequest("Interested."))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithAnonymousUser
    void publicJobDetailIsAccessible() throws Exception {
        UUID jobId = UUID.randomUUID();
        when(jobService.getJob(jobId)).thenReturn(jobResponse());

        mockMvc.perform(get("/api/jobs/{id}", jobId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    @WithMockUser(username = "employer@example.com")
    void employerCanCreateUpdateAndCloseJob() throws Exception {
        JobRequest request = new JobRequest("Electrician", "Home wiring", "Electrical",
                EmploymentType.FULL_TIME, "Soweto", "Gauteng");
        when(jobService.createJob(any())).thenReturn(jobResponse());
        when(jobService.updateJob(any(), any())).thenReturn(jobResponse());
        when(jobService.updateJobStatus(any(), eq(JobStatus.CLOSED))).thenReturn(
                new JobResponse(UUID.randomUUID(), UUID.randomUUID(), "Employer",
                        "Electrician", "Home wiring", "Electrical", EmploymentType.FULL_TIME,
                        JobStatus.CLOSED, "Soweto", "Gauteng", null, null));
        UUID jobId = UUID.randomUUID();

        mockMvc.perform(post("/api/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
        mockMvc.perform(put("/api/jobs/{id}", jobId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/api/jobs/{id}/status", jobId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new JobStatusRequest(JobStatus.CLOSED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    @WithMockUser(username = "applicant@example.com")
    void applicantCanApplyAndEmployerCanReviewApplicationStatus() throws Exception {
        UUID jobId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        when(applicationService.apply(eq(jobId), any())).thenReturn(applicationResponse(jobId, applicationId));
        when(applicationService.updateApplicationStatus(eq(jobId), eq(applicationId), eq(ApplicationStatus.ACCEPTED)))
                .thenReturn(applicationResponse(jobId, applicationId));

        mockMvc.perform(post("/api/jobs/{id}/applications", jobId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new JobApplicationRequest("Interested."))))
                .andExpect(status().isCreated());
        mockMvc.perform(patch("/api/jobs/{jobId}/applications/{applicationId}", jobId, applicationId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new JobApplicationStatusRequest(ApplicationStatus.ACCEPTED))))
                .andExpect(status().isOk());
        verify(applicationService).updateApplicationStatus(jobId, applicationId, ApplicationStatus.ACCEPTED);
    }

    @Test
    @WithMockUser(username = "employer@example.com")
    void invalidJobRequestIsRejectedByValidation() throws Exception {
        JobRequest request = new JobRequest("", "Description", "Other",
                EmploymentType.FULL_TIME, "Soweto", "Gauteng");

        mockMvc.perform(post("/api/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    private JobResponse jobResponse() {
        return new JobResponse(UUID.randomUUID(), UUID.randomUUID(), "Employer Name", "Electrician",
                "Home wiring", "Electrical", EmploymentType.FULL_TIME, JobStatus.OPEN,
                "Soweto", "Gauteng", null, null);
    }

    private JobApplicationResponse applicationResponse(UUID jobId, UUID applicationId) {
        return new JobApplicationResponse(applicationId, jobId, "Electrician", "Employer Name",
                UUID.randomUUID(), "Applicant Name", "Interested.", ApplicationStatus.PENDING, null);
    }
}
