package com.example.Rental.controller;

import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.SystemStatisticsResponse;
import com.example.Rental.service.AdminStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/statistics")
@RequiredArgsConstructor
public class AdminStatisticsController {

    private final AdminStatisticsService statisticsService;

    @GetMapping
    public ResponseEntity<ApiResponse<SystemStatisticsResponse>> getStatistics() {
        SystemStatisticsResponse stats = statisticsService.getSystemStatistics();
        return ResponseEntity.ok(ApiResponse.ok("System statistics retrieved successfully", stats));
    }
}
