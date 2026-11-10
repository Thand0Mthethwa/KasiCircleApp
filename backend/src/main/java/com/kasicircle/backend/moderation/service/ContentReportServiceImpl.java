package com.kasicircle.backend.moderation.service;

import com.kasicircle.backend.businesses.repository.BusinessRepository;
import com.kasicircle.backend.businesses.repository.BusinessReviewRepository;
import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.domain.BusinessReview;
import com.kasicircle.backend.jobs.repository.JobRepository;
import com.kasicircle.backend.jobs.domain.Job;
import com.kasicircle.backend.moderation.domain.ContentReport;
import com.kasicircle.backend.moderation.domain.ReportStatus;
import com.kasicircle.backend.moderation.domain.ReportTargetType;
import com.kasicircle.backend.moderation.dto.ContentReportResponse;
import com.kasicircle.backend.moderation.dto.CreateReportRequest;
import com.kasicircle.backend.moderation.dto.ModerationDecisionRequest;
import com.kasicircle.backend.moderation.repository.ContentReportRepository;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import com.kasicircle.backend.workers.domain.WorkerProfile;
import com.kasicircle.backend.workers.repository.WorkerProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
public class ContentReportServiceImpl implements ContentReportService {

    private final ContentReportRepository reportRepository;
    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final BusinessReviewRepository reviewRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final JobRepository jobRepository;

    public ContentReportServiceImpl(
            ContentReportRepository reportRepository,
            UserRepository userRepository,
            BusinessRepository businessRepository,
            BusinessReviewRepository reviewRepository,
            WorkerProfileRepository workerProfileRepository,
            JobRepository jobRepository
    ) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.businessRepository = businessRepository;
        this.reviewRepository = reviewRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.jobRepository = jobRepository;
    }

    @Override
    @Transactional
    public ContentReportResponse createReport(CreateReportRequest request) {
        User reporter = getAuthenticatedUser();
        if (!targetExists(request.targetType(), request.targetId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "The reported content was not found.");
        }
        if (reportRepository.existsByReporter_IdAndTargetTypeAndTargetIdAndStatus(
                reporter.getId(), request.targetType(), request.targetId(), ReportStatus.OPEN)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have an open report for this content.");
        }

        ContentReport report = new ContentReport();
        report.setReporter(reporter);
        report.setTargetType(request.targetType());
        report.setTargetId(request.targetId());
        report.setReason(request.reason());
        report.setDetails(normalize(request.details()));
        report.setStatus(ReportStatus.OPEN);
        return toResponse(reportRepository.save(report), false);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ContentReportResponse> getOpenReports(Pageable pageable) {
        return reportRepository.findByStatusOrderByCreatedAtAsc(ReportStatus.OPEN, pageable)
                .map(report -> toResponse(report, true));
    }

    @Override
    @Transactional
    public ContentReportResponse moderateReport(UUID reportId, ModerationDecisionRequest request) {
        if (request.status() == ReportStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A moderation decision must close the report.");
        }
        ContentReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found."));
        if (report.getStatus() != ReportStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This report has already been resolved.");
        }
        report.setStatus(request.status());
        report.setModerationNote(normalize(request.moderationNote()));
        report.setModeratedBy(getAuthenticatedUser());
        report.setModeratedAt(Instant.now());
        return toResponse(reportRepository.save(report), true);
    }

    private boolean targetExists(ReportTargetType targetType, UUID targetId) {
        return switch (targetType) {
            case BUSINESS -> businessRepository.existsById(targetId);
            case WORKER_PROFILE -> workerProfileRepository.existsById(targetId);
            case JOB -> jobRepository.existsById(targetId);
            case BUSINESS_REVIEW -> reviewRepository.existsById(targetId);
        };
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication != null && authentication.getPrincipal() instanceof UserDetails details
                ? details.getUsername()
                : authentication != null ? authentication.getName() : null;
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found."));
    }

    private String normalize(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private ContentReportResponse toResponse(ContentReport report, boolean includeTargetSummary) {
        return new ContentReportResponse(
                report.getId(),
                report.getTargetType(),
                report.getTargetId(),
                includeTargetSummary ? targetSummary(report) : null,
                report.getReason(),
                report.getDetails(),
                report.getStatus(),
                report.getModerationNote(),
                report.getCreatedAt(),
                report.getModeratedAt()
        );
    }

    private String targetSummary(ContentReport report) {
        return switch (report.getTargetType()) {
            case BUSINESS -> businessRepository.findById(report.getTargetId())
                    .map(business -> business.getName() + ": " + business.getDescription()).orElse("Business no longer exists.");
            case WORKER_PROFILE -> workerProfileRepository.findById(report.getTargetId())
                    .map(profile -> profile.getHeadline() + ": " + profile.getBio()).orElse("Worker profile no longer exists.");
            case JOB -> jobRepository.findById(report.getTargetId())
                    .map(job -> job.getTitle() + ": " + job.getDescription()).orElse("Job no longer exists.");
            case BUSINESS_REVIEW -> reviewRepository.findById(report.getTargetId())
                    .map(this::reviewSummary).orElse("Business review no longer exists.");
        };
    }

    private String reviewSummary(BusinessReview review) {
        String comment = review.getComment();
        return "Rating: " + review.getRating() + (comment == null || comment.isBlank() ? "" : "; " + comment);
    }
}
