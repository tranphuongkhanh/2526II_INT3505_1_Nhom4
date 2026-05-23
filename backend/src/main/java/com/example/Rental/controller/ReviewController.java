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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rental.dto.request.RenterReviewRequest;
import com.example.Rental.dto.request.ReviewRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.PaginationMetaResponse;
import com.example.Rental.dto.response.ReviewListResponse;
import com.example.Rental.dto.response.ReviewResponse;
import com.example.Rental.entity.Review;
import com.example.Rental.service.ReviewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/rooms/{roomId}/reviews")
    public ResponseEntity<ApiResponse<ReviewListResponse>> getRoomReviews(
            @PathVariable Long roomId,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        

        
        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Review> reviewPage = reviewService.getApprovedRoomReviews(roomId, pageable);
        
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
                
        return ResponseEntity.ok(ApiResponse.ok("Room reviews retrieved", response));
    }

    @PostMapping("/rooms/{roomId}/reviews")
    public ResponseEntity<ApiResponse<Void>> createRoomReview(
            @PathVariable Long roomId,
            @Valid @RequestBody ReviewRequest request,
            Principal principal) {
        reviewService.createRoomReview(roomId, request, principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("Review submitted and pending approval", null));
    }

    @PostMapping("/contracts/{contractId}/renter-review")
    public ResponseEntity<ApiResponse<Void>> createRenterReview(
            @PathVariable Long contractId,
            @Valid @RequestBody RenterReviewRequest request,
            Principal principal) {
        reviewService.createRenterReview(contractId, request, principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("Review submitted and pending approval", null));
    }

    @GetMapping("/users/{userId}/renter-reviews")
    public ResponseEntity<ApiResponse<ReviewListResponse>> getRenterReviews(
            @PathVariable Long userId,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
            

        
        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Review> reviewPage = reviewService.getApprovedRenterReviews(userId, pageable);
        
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
                
        return ResponseEntity.ok(ApiResponse.ok("Renter reviews retrieved", response));
    }

    @PatchMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody com.example.Rental.dto.request.ReviewUpdateRequest request,
            Principal principal) {
        reviewService.updateReview(reviewId, request, principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("Review updated and is pending approval", null));
    }
}
