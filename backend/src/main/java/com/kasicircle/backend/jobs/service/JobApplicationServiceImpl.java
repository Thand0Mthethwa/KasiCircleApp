package com.kasicircle.backend.jobs.service;

import com.kasicircle.backend.jobs.domain.ApplicationStatus;
import com.kasicircle.backend.jobs.domain.Job;
import com.kasicircle.backend.jobs.domain.JobApplication;
import com.kasicircle.backend.jobs.domain.JobStatus;
import com.kasicircle.backend.jobs.dto.JobApplicationRequest;
import com.kasicircle.backend.jobs.dto.JobApplicationResponse;
import com.kasicircle.backend.jobs.exception.JobApplicationNotFoundException;
import com.kasicircle.backend.jobs.exception.JobNotFoundException;
import com.kasicircle.backend.jobs.repository.JobApplicationRepository;
import com.kasicircle.backend.jobs.repository.JobRepository;
import com.kasicircle.backend.notifications.domain.NotificationType;
import com.kasicircle.backend.notifications.service.NotificationService;
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

import java.util.List;
import java.util.UUID;

@Service
public class JobApplicationServiceImpl implements JobApplicationService {

    private final JobApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public JobApplicationServiceImpl(
            JobApplicationRepository applicationRepository,
            JobRepository jobRepository,
            UserRepository userRepository,
            NotificationService notificationService
    ) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public JobApplicationResponse apply(UUID jobId, JobApplicationRequest request) {
        User applicant = getCurrentUser();
        Job job = getJob(jobId);
        if (job.getEmployer().getId().equals(applicant.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Employers cannot apply to their own jobs.");
        }
        if (job.getStatus() != JobStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This job is no longer accepting applications.");
        }
        if (applicationRepository.existsByJobIdAndApplicantId(jobId, applicant.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already applied for this job.");
        }

        JobApplication application = new JobApplication();
        application.setJob(job);
        application.setApplicant(applicant);
        application.setMessage(request.message() == null ? null : request.message().trim());
        JobApplication savedApplication = applicationRepository.save(application);
        notificationService.createNotification(
                job.getEmployer().getId(),
                NotificationType.JOB_APPLICATION,
                "New job application",
                applicant.getFirstName() + " " + applicant.getLastName() + " applied to " + job.getTitle() + ".",
                "JOB",
                job.getId()
        );
        return toResponse(savedApplication);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobApplicationResponse> getMyApplications(Pageable pageable) {
        User applicant = getCurrentUser();
        return applicationRepository.findByApplicantIdOrderByCreatedAtDesc(applicant.getId(), pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobApplicationResponse> getApplicationsForJob(UUID jobId) {
        User employer = getCurrentUser();
        Job job = getJob(jobId);
        verifyEmployer(job, employer);
        return applicationRepository.findByJobIdOrderByCreatedAtDesc(jobId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public JobApplicationResponse updateApplicationStatus(
            UUID jobId, UUID applicationId, ApplicationStatus status
    ) {
        User employer = getCurrentUser();
        Job job = getJob(jobId);
        verifyEmployer(job, employer);
        if (status == ApplicationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Application status must be ACCEPTED or REJECTED.");
        }
        JobApplication application = applicationRepository.findByIdAndJobId(applicationId, jobId)
                .orElseThrow(() -> new JobApplicationNotFoundException("Application not found."));
        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending applications can be reviewed.");
        }
        application.setStatus(status);
        JobApplication savedApplication = applicationRepository.save(application);
        notificationService.createNotification(
                application.getApplicant().getId(),
                NotificationType.APPLICATION_STATUS,
                "Application update",
                "Your application for " + job.getTitle() + " was " + status.name().toLowerCase() + ".",
                "JOB",
                job.getId()
        );
        return toResponse(savedApplication);
    }

    private Job getJob(UUID jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException("Job with ID " + jobId + " not found."));
    }

    private void verifyEmployer(Job job, User employer) {
        if (!job.getEmployer().getId().equals(employer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to manage applications for this job.");
        }
    }

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = principal instanceof UserDetails details ? details.getUsername() : principal.toString();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User with email " + email + " not found."));
    }

    private JobApplicationResponse toResponse(JobApplication application) {
        User applicant = application.getApplicant();
        User employer = application.getJob().getEmployer();
        return new JobApplicationResponse(
                application.getId(),
                application.getJob().getId(),
                application.getJob().getTitle(),
                employer.getFirstName() + " " + employer.getLastName(),
                applicant.getId(),
                applicant.getFirstName() + " " + applicant.getLastName(),
                application.getMessage(),
                application.getStatus(),
                application.getCreatedAt()
        );
    }
}
