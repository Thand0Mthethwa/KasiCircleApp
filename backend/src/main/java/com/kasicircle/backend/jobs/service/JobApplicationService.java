package com.kasicircle.backend.jobs.service;

import com.kasicircle.backend.jobs.domain.ApplicationStatus;
import com.kasicircle.backend.jobs.dto.JobApplicationRequest;
import com.kasicircle.backend.jobs.dto.JobApplicationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface JobApplicationService {

    JobApplicationResponse apply(UUID jobId, JobApplicationRequest request);

    Page<JobApplicationResponse> getMyApplications(Pageable pageable);

    List<JobApplicationResponse> getApplicationsForJob(UUID jobId);

    JobApplicationResponse updateApplicationStatus(UUID jobId, UUID applicationId, ApplicationStatus status);
}
