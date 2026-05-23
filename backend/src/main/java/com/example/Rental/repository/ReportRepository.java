package com.example.Rental.repository;

import com.example.Rental.entity.Report;
import com.example.Rental.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByStatus(ReportStatus status);
    Page<Report> findByStatus(ReportStatus status, Pageable pageable);
    Page<Report> findByReporterId(Long reporterId, Pageable pageable);
    boolean existsByReporterIdAndPostIdAndStatus(Long reporterId, Long postId, ReportStatus status);
}
