package com.example.Rental.controller;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rental.dto.request.ReviewStatusUpdateRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.ReviewResponse;
import com.example.Rental.service.ReviewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getPendingReviews() {
        List<ReviewResponse> response = reviewService.getPendingReviews()
                .stream()
                .map(ReviewResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok("Pending reviews retrieved", response));
    }

    @PatchMapping("/{reviewId}/status")
    public ResponseEntity<ApiResponse<Void>> updateReviewStatus(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewStatusUpdateRequest request,
            Principal principal) {
        reviewService.updateReviewStatus(reviewId, request.getStatus(), principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("Review status updated successfully", null));
    }
}
