package com.kasicircle.backend.moderation.controller;

import com.kasicircle.backend.moderation.domain.ReportReason;
import com.kasicircle.backend.moderation.domain.ReportStatus;
import com.kasicircle.backend.moderation.domain.ReportTargetType;
import com.kasicircle.backend.moderation.dto.ContentReportResponse;
import com.kasicircle.backend.moderation.dto.ModerationDecisionRequest;
import com.kasicircle.backend.moderation.service.ContentReportService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ContentReportControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private ContentReportService contentReportService;

    @Test
    @WithAnonymousUser
    void reportSubmissionRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/reports")
                        .contentType("application/json")
                        .content("""
                                {"targetType":"JOB","targetId":"%s","reason":"SPAM"}
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void regularUsersCannotAccessModerationQueueOrDecideReports() throws Exception {
        UUID reportId = UUID.randomUUID();
        mockMvc.perform(get("/api/reports")).andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/reports/{id}/moderation", reportId)
                        .contentType("application/json")
                        .content("""
                                {"status":"DISMISSED","moderationNote":"Reviewed"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = "ADMIN")
    void administratorsCanReviewReportsAndResponseDoesNotIncludeReporterIdentity() throws Exception {
        UUID reportId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        ContentReportResponse response = new ContentReportResponse(reportId, ReportTargetType.JOB, targetId,
                "Electrician: Wiring", ReportReason.FRAUD, "Suspicious", ReportStatus.ACTIONED, "Removed",
                Instant.parse("2026-01-01T10:00:00Z"), Instant.parse("2026-01-01T11:00:00Z"));
        when(contentReportService.getOpenReports(any())).thenReturn(
                new PageImpl<>(List.of(response), PageRequest.of(0, 20), 1));
        when(contentReportService.moderateReport(any(), any())).thenReturn(response);

        mockMvc.perform(get("/api/reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].targetType").value("JOB"))
                .andExpect(jsonPath("$.content[0].reporter").doesNotExist())
                .andExpect(jsonPath("$.content[0].reporterEmail").doesNotExist());
        mockMvc.perform(patch("/api/reports/{id}/moderation", reportId)
                        .contentType("application/json")
                        .content("""
                                {"status":"ACTIONED","moderationNote":"Removed"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIONED"));
        verify(contentReportService).moderateReport(reportId,
                new ModerationDecisionRequest(ReportStatus.ACTIONED, "Removed"));
    }
}
