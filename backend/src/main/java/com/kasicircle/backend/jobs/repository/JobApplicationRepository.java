package com.kasicircle.backend.jobs.repository;

import com.kasicircle.backend.jobs.domain.JobApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {

    boolean existsByJobIdAndApplicantId(UUID jobId, UUID applicantId);

    @EntityGraph(attributePaths = {"applicant"})
    List<JobApplication> findByJobIdOrderByCreatedAtDesc(UUID jobId);

    @EntityGraph(attributePaths = {"applicant", "job", "job.employer"})
    Page<JobApplication> findByApplicantIdOrderByCreatedAtDesc(UUID applicantId, Pageable pageable);

    @EntityGraph(attributePaths = {"applicant"})
    Optional<JobApplication> findByIdAndJobId(UUID id, UUID jobId);
}
