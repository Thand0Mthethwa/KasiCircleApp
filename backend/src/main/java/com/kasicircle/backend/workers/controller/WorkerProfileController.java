package com.kasicircle.backend.workers.controller;

import com.kasicircle.backend.workers.dto.WorkerProfileRequest;
import com.kasicircle.backend.workers.dto.WorkerProfileResponse;
import com.kasicircle.backend.workers.service.WorkerProfileService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/workers")
public class WorkerProfileController {

    private final WorkerProfileService workerProfileService;

    public WorkerProfileController(WorkerProfileService workerProfileService) {
        this.workerProfileService = workerProfileService;
    }

    @GetMapping
    public ResponseEntity<Page<WorkerProfileResponse>> searchWorkers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String city,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(workerProfileService.searchPublicProfiles(search, category, skill, city, pageable));
    }

    @GetMapping("/me")
    public ResponseEntity<WorkerProfileResponse> getMyProfile() {
        return ResponseEntity.ok(workerProfileService.getMyProfile());
    }

    @PostMapping("/me")
    public ResponseEntity<WorkerProfileResponse> createMyProfile(@Valid @RequestBody WorkerProfileRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workerProfileService.createMyProfile(request));
    }

    @PutMapping("/me")
    public ResponseEntity<WorkerProfileResponse> updateMyProfile(@Valid @RequestBody WorkerProfileRequest request) {
        return ResponseEntity.ok(workerProfileService.updateMyProfile(request));
    }

    @GetMapping("/{profileId}")
    public ResponseEntity<WorkerProfileResponse> getWorkerProfile(@PathVariable UUID profileId) {
        return ResponseEntity.ok(workerProfileService.getPublicProfile(profileId));
    }
}
