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

import com.example.Rental.dto.request.ReviewStatusUpdateRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.PaginationMetaResponse;
import com.example.Rental.dto.response.ReviewListResponse;
import com.example.Rental.dto.response.ReviewResponse;
import com.example.Rental.entity.Review;
import com.example.Rental.service.ReviewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<ApiResponse<ReviewListResponse>> getPendingReviews(
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
            

        
        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Review> reviewPage = reviewService.getPendingReviews(pageable);
        
        List<ReviewResponse> items = reviewPage.getContent().stream()
                .map(ReviewResponse::fromEntity)
                .collect(Collectors.toList());
                
        PaginationMetaResponse meta = PaginationMetaResponse.builder()
                .total(reviewPage.getTotalElements())
                .page(page)
                .limit(limit)
                .build();
                
        ReviewListResponse response = ReviewListResponse.builder()
                .items(items)
                .meta(meta)
                .build();
                
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
