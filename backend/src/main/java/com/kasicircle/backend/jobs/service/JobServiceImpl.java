package com.kasicircle.backend.jobs.service;

import com.kasicircle.backend.jobs.domain.Job;
import com.kasicircle.backend.jobs.domain.JobStatus;
import com.kasicircle.backend.jobs.dto.JobRequest;
import com.kasicircle.backend.jobs.dto.JobResponse;
import com.kasicircle.backend.jobs.exception.JobNotFoundException;
import com.kasicircle.backend.jobs.repository.JobRepository;
import com.kasicircle.backend.jobs.repository.JobSpecifications;
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

import java.util.UUID;

@Service
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    public JobServiceImpl(JobRepository jobRepository, UserRepository userRepository) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public JobResponse createJob(JobRequest request) {
        Job job = new Job();
        job.setEmployer(getCurrentUser());
        applyRequest(job, request);
        job.setStatus(JobStatus.OPEN);
        return toResponse(jobRepository.save(job));
    }

    @Override
    @Transactional
    public JobResponse updateJob(UUID jobId, JobRequest request) {
        User employer = getCurrentUser();
        Job job = getJobEntity(jobId);
        verifyEmployer(job, employer);
        if (job.getStatus() == JobStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Closed jobs cannot be edited.");
        }
        applyRequest(job, request);
        return toResponse(jobRepository.save(job));
    }

    @Override
    @Transactional
    public JobResponse updateJobStatus(UUID jobId, JobStatus status) {
        User employer = getCurrentUser();
        Job job = getJobEntity(jobId);
        verifyEmployer(job, employer);
        job.setStatus(status);
        return toResponse(jobRepository.save(job));
    }

    @Override
    @Transactional(readOnly = true)
    public JobResponse getJob(UUID jobId) {
        return toResponse(getJobEntity(jobId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobResponse> searchJobs(
            String search, String category, String city, JobStatus status, Pageable pageable
    ) {
        JobStatus requestedStatus = status == null ? JobStatus.OPEN : status;
        return jobRepository.findAll(JobSpecifications.withFilters(search, category, city, requestedStatus), pageable)
                .map(this::toResponse);
    }

    private void applyRequest(Job job, JobRequest request) {
        job.setTitle(request.title().trim());
        job.setDescription(request.description().trim());
        job.setCategory(request.category().trim());
        job.setEmploymentType(request.employmentType());
        job.setCity(request.city().trim());
        job.setProvince(request.province().trim());
    }

    private Job getJobEntity(UUID jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException("Job with ID " + jobId + " not found."));
    }

    private void verifyEmployer(Job job, User employer) {
        if (job.getEmployer() == null || !job.getEmployer().getId().equals(employer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to manage this job.");
        }
    }

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = principal instanceof UserDetails details ? details.getUsername() : principal.toString();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User with email " + email + " not found."));
    }

    private JobResponse toResponse(Job job) {
        User employer = job.getEmployer();
        return new JobResponse(
                job.getId(),
                employer.getId(),
                employer.getFirstName() + " " + employer.getLastName(),
                job.getTitle(),
                job.getDescription(),
                job.getCategory(),
                job.getEmploymentType(),
                job.getStatus(),
                job.getCity(),
                job.getProvince(),
                job.getCreatedAt(),
                job.getUpdatedAt()
        );
    }
}
