package com.kasicircle.backend.moderation.service;

import com.kasicircle.backend.moderation.dto.ContentReportResponse;
import com.kasicircle.backend.moderation.dto.CreateReportRequest;
import com.kasicircle.backend.moderation.dto.ModerationDecisionRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ContentReportService {
    ContentReportResponse createReport(CreateReportRequest request);
    Page<ContentReportResponse> getOpenReports(Pageable pageable);
    ContentReportResponse moderateReport(UUID reportId, ModerationDecisionRequest request);
}
