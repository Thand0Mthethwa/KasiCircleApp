package com.kasicircle.backend.moderation.controller;

import com.kasicircle.backend.moderation.dto.ContentReportResponse;
import com.kasicircle.backend.moderation.dto.CreateReportRequest;
import com.kasicircle.backend.moderation.dto.ModerationDecisionRequest;
import com.kasicircle.backend.moderation.service.ContentReportService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
public class ContentReportController {

    private final ContentReportService contentReportService;

    public ContentReportController(ContentReportService contentReportService) {
        this.contentReportService = contentReportService;
    }

    @PostMapping
    public ResponseEntity<ContentReportResponse> createReport(@Valid @RequestBody CreateReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contentReportService.createReport(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<ContentReportResponse> getOpenReports(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return contentReportService.getOpenReports(pageable);
    }

    @PatchMapping("/{reportId}/moderation")
    @PreAuthorize("hasRole('ADMIN')")
    public ContentReportResponse moderateReport(
            @PathVariable UUID reportId,
            @Valid @RequestBody ModerationDecisionRequest request
    ) {
        return contentReportService.moderateReport(reportId, request);
    }
}
