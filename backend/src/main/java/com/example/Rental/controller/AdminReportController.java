package com.example.Rental.controller;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rental.dto.request.ReportStatusUpdateRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.PaginationMetaResponse;
import com.example.Rental.dto.response.ReportListResponse;
import com.example.Rental.dto.response.ReportResponse;
import com.example.Rental.entity.Report;
import com.example.Rental.enums.ReportStatus;
import com.example.Rental.service.ReportService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final ReportService reportService;

    @GetMapping
    public ResponseEntity<ApiResponse<ReportListResponse>> getAllReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        
        page = (page == null || page < 1) ? 1 : page;
        limit = (limit == null || limit < 1) ? 10 : limit;
        limit = Math.min(limit, 100);
        
        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Report> reportPage = reportService.getAllReports(status, pageable);
        
        List<ReportResponse> items = reportPage.getContent().stream()
                .map(ReportResponse::fromEntity)
                .collect(Collectors.toList());
                
        PaginationMetaResponse meta = PaginationMetaResponse.builder()
                .total(reportPage.getTotalElements())
                .page(page)
                .limit(limit)
                .build();
                
        ReportListResponse response = ReportListResponse.builder()
                .items(items)
                .meta(meta)
                .build();
                
        return ResponseEntity.ok(ApiResponse.ok("Reports retrieved", response));
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<ApiResponse<ReportResponse>> getReportById(@PathVariable Long reportId) {
        Report report = reportService.getReportById(reportId);
        return ResponseEntity.ok(ApiResponse.ok("Report details retrieved", ReportResponse.fromEntity(report)));
    }

    @PatchMapping("/{reportId}/status")
    public ResponseEntity<ApiResponse<Void>> updateReportStatus(
            @PathVariable Long reportId,
            @Valid @RequestBody ReportStatusUpdateRequest request,
            Principal principal) {
        reportService.updateReportStatus(reportId, request, principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("Report status updated successfully", null));
    }
}
