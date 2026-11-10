package com.kasicircle.backend.moderation.repository;

import com.kasicircle.backend.moderation.domain.ContentReport;
import com.kasicircle.backend.moderation.domain.ReportStatus;
import com.kasicircle.backend.moderation.domain.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ContentReportRepository extends JpaRepository<ContentReport, UUID> {
    boolean existsByReporter_IdAndTargetTypeAndTargetIdAndStatus(
            UUID reporterId, ReportTargetType targetType, UUID targetId, ReportStatus status);

    Page<ContentReport> findByStatusOrderByCreatedAtAsc(ReportStatus status, Pageable pageable);
}
