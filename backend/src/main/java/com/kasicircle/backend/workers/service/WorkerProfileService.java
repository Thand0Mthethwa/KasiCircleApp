package com.kasicircle.backend.workers.service;

import com.kasicircle.backend.workers.dto.WorkerProfileRequest;
import com.kasicircle.backend.workers.dto.WorkerProfileResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface WorkerProfileService {

    WorkerProfileResponse createMyProfile(WorkerProfileRequest request);

    WorkerProfileResponse updateMyProfile(WorkerProfileRequest request);

    WorkerProfileResponse getMyProfile();

    WorkerProfileResponse getPublicProfile(UUID profileId);

    Page<WorkerProfileResponse> searchPublicProfiles(
            String search, String category, String skill, String city, Pageable pageable);
}
