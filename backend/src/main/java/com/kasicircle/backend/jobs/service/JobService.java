package com.kasicircle.backend.jobs.service;

import com.kasicircle.backend.jobs.domain.JobStatus;
import com.kasicircle.backend.jobs.dto.JobRequest;
import com.kasicircle.backend.jobs.dto.JobResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface JobService {

    JobResponse createJob(JobRequest request);

    JobResponse updateJob(UUID jobId, JobRequest request);

    JobResponse updateJobStatus(UUID jobId, JobStatus status);

    JobResponse getJob(UUID jobId);

    Page<JobResponse> searchJobs(String search, String category, String city, JobStatus status, Pageable pageable);
}
