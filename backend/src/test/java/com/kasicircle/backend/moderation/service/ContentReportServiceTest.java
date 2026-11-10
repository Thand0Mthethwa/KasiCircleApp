package com.kasicircle.backend.moderation.service;

import com.kasicircle.backend.businesses.repository.BusinessRepository;
import com.kasicircle.backend.businesses.repository.BusinessReviewRepository;
import com.kasicircle.backend.jobs.domain.Job;
import com.kasicircle.backend.jobs.repository.JobRepository;
import com.kasicircle.backend.moderation.domain.ContentReport;
import com.kasicircle.backend.moderation.domain.ReportReason;
import com.kasicircle.backend.moderation.domain.ReportStatus;
import com.kasicircle.backend.moderation.domain.ReportTargetType;
import com.kasicircle.backend.moderation.dto.CreateReportRequest;
import com.kasicircle.backend.moderation.dto.ModerationDecisionRequest;
import com.kasicircle.backend.moderation.repository.ContentReportRepository;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import com.kasicircle.backend.workers.repository.WorkerProfileRepository;
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
import java.util.Optional;
import java.util.UUID;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContentReportServiceTest {

    @Mock private ContentReportRepository reportRepository;
    @Mock private UserRepository userRepository;
    @Mock private BusinessRepository businessRepository;
    @Mock private BusinessReviewRepository reviewRepository;
    @Mock private WorkerProfileRepository workerProfileRepository;
    @Mock private JobRepository jobRepository;

    private ContentReportServiceImpl service;
    private final UUID reporterId = UUID.randomUUID();
    private final UUID targetId = UUID.randomUUID();
    private final UUID reportId = UUID.randomUUID();
    private final User reporter = User.builder().id(reporterId).firstName("Report").lastName("User")
            .email("reporter@example.com").build();

    @BeforeEach
    void setUp() {
        service = new ContentReportServiceImpl(reportRepository, userRepository, businessRepository,
                reviewRepository, workerProfileRepository, jobRepository);
        authenticate(reporter.getEmail());
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createsReportForExistingContentWithoutExposingReporterIdentity() {
        when(userRepository.findByEmail(reporter.getEmail())).thenReturn(Optional.of(reporter));
        when(jobRepository.existsById(targetId)).thenReturn(true);
        when(reportRepository.existsByReporter_IdAndTargetTypeAndTargetIdAndStatus(
                reporterId, ReportTargetType.JOB, targetId, ReportStatus.OPEN)).thenReturn(false);
        when(reportRepository.save(any(ContentReport.class))).thenAnswer(invocation -> {
            ContentReport report = invocation.getArgument(0);
            report.setId(reportId);
            report.setCreatedAt(Instant.parse("2026-01-01T10:00:00Z"));
            return report;
        });

        var response = service.createReport(new CreateReportRequest(
                ReportTargetType.JOB, targetId, ReportReason.FRAUD, "  Suspicious listing.  "));

        assertEquals(reportId, response.id());
        assertEquals("Suspicious listing.", response.details());
        assertEquals(ReportStatus.OPEN, response.status());
        assertEquals(null, response.targetSummary());
        org.junit.jupiter.api.Assertions.assertFalse(java.util.Arrays.stream(response.getClass().getRecordComponents())
                .anyMatch(component -> component.getName().toLowerCase().contains("reporter")));
    }

    @Test
    void rejectsUnknownTargetsAndDuplicateOpenReports() {
        when(userRepository.findByEmail(reporter.getEmail())).thenReturn(Optional.of(reporter));
        when(businessRepository.existsById(targetId)).thenReturn(false);
        assertThrows(ResponseStatusException.class, () -> service.createReport(
                new CreateReportRequest(ReportTargetType.BUSINESS, targetId, ReportReason.SPAM, null)));

        when(jobRepository.existsById(targetId)).thenReturn(true);
        when(reportRepository.existsByReporter_IdAndTargetTypeAndTargetIdAndStatus(
                reporterId, ReportTargetType.JOB, targetId, ReportStatus.OPEN)).thenReturn(true);
        assertThrows(ResponseStatusException.class, () -> service.createReport(
                new CreateReportRequest(ReportTargetType.JOB, targetId, ReportReason.SPAM, null)));
        verify(reportRepository, never()).save(any(ContentReport.class));
    }

    @Test
    void adminQueueIncludesReportedContentSummaryWithoutReporterIdentity() {
        ContentReport report = new ContentReport();
        report.setId(reportId);
        report.setTargetType(ReportTargetType.JOB);
        report.setTargetId(targetId);
        report.setReason(ReportReason.FRAUD);
        report.setStatus(ReportStatus.OPEN);
        report.setCreatedAt(Instant.parse("2026-01-01T10:00:00Z"));
        Job job = new Job();
        job.setTitle("Electrician");
        job.setDescription("Residential wiring.");
        PageRequest pageable = PageRequest.of(0, 20);
        when(reportRepository.findByStatusOrderByCreatedAtAsc(ReportStatus.OPEN, pageable))
                .thenReturn(new PageImpl<>(List.of(report), pageable, 1));
        when(jobRepository.findById(targetId)).thenReturn(Optional.of(job));

        var result = service.getOpenReports(pageable).getContent().get(0);

        assertEquals("Electrician: Residential wiring.", result.targetSummary());
        org.junit.jupiter.api.Assertions.assertFalse(java.util.Arrays.stream(result.getClass().getRecordComponents())
                .anyMatch(component -> component.getName().toLowerCase().contains("reporter")));
    }

    @Test
    void recordsAdminDecisionAndRejectsReopeningReports() {
        ContentReport report = new ContentReport();
        report.setId(reportId);
        report.setTargetType(ReportTargetType.JOB);
        report.setTargetId(targetId);
        report.setStatus(ReportStatus.OPEN);
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(userRepository.findByEmail(reporter.getEmail())).thenReturn(Optional.of(reporter));
        when(reportRepository.save(report)).thenReturn(report);

        var response = service.moderateReport(reportId,
                new ModerationDecisionRequest(ReportStatus.ACTIONED, "Content removed."));

        assertEquals(ReportStatus.ACTIONED, response.status());
        assertEquals("Content removed.", response.moderationNote());
        verify(reportRepository).save(report);

        assertThrows(ResponseStatusException.class, () -> service.moderateReport(reportId,
                new ModerationDecisionRequest(ReportStatus.OPEN, null)));
    }

    private void authenticate(String email) {
        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername(email).password("unused").roles("USER").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }
}
