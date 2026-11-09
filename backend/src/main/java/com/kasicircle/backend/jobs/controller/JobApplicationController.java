package com.kasicircle.backend.jobs.controller;

import com.kasicircle.backend.jobs.domain.ApplicationStatus;
import com.kasicircle.backend.jobs.dto.JobApplicationRequest;
import com.kasicircle.backend.jobs.dto.JobApplicationResponse;
import com.kasicircle.backend.jobs.dto.JobApplicationStatusRequest;
import com.kasicircle.backend.jobs.service.JobApplicationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
public class JobApplicationController {

    private final JobApplicationService applicationService;

    public JobApplicationController(JobApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping("/{jobId}/applications")
    public ResponseEntity<JobApplicationResponse> apply(
            @PathVariable UUID jobId,
            @Valid @RequestBody JobApplicationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.apply(jobId, request));
    }

    @GetMapping("/me/applications")
    public ResponseEntity<Page<JobApplicationResponse>> getMyApplications(
            @PageableDefault(sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC)
            Pageable pageable
    ) {
        return ResponseEntity.ok(applicationService.getMyApplications(pageable));
    }

    @GetMapping("/{jobId}/applications")
    public ResponseEntity<List<JobApplicationResponse>> getApplicationsForJob(@PathVariable UUID jobId) {
        return ResponseEntity.ok(applicationService.getApplicationsForJob(jobId));
    }

    @PatchMapping("/{jobId}/applications/{applicationId}")
    public ResponseEntity<JobApplicationResponse> updateApplicationStatus(
            @PathVariable UUID jobId,
            @PathVariable UUID applicationId,
            @Valid @RequestBody JobApplicationStatusRequest request
    ) {
        ApplicationStatus status = request.status();
        return ResponseEntity.ok(applicationService.updateApplicationStatus(jobId, applicationId, status));
    }
}
