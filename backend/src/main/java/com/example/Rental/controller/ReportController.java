package com.example.Rental.controller;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rental.dto.request.ReportRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.PaginationMetaResponse;
import com.example.Rental.dto.response.ReportListResponse;
import com.example.Rental.dto.response.ReportResponse;
import com.example.Rental.entity.Report;
import com.example.Rental.service.ReportService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/posts/{postId}/reports")
    public ResponseEntity<ApiResponse<Void>> createReport(
            @PathVariable Long postId,
            @Valid @RequestBody ReportRequest request,
            Principal principal) {
        reportService.createReport(postId, request, principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("Report submitted successfully", null));
    }

    @GetMapping("/users/me/reports")
    public ResponseEntity<ApiResponse<ReportListResponse>> getUserReports(
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            Principal principal) {
        
        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Report> reportPage = reportService.getUserReports(principal.getName(), pageable);
        
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
                
        return ResponseEntity.ok(ApiResponse.ok("User reports retrieved", response));
    }
}
