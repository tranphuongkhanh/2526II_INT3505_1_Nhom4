package com.example.Rental.controller;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rental.dto.request.RenterReviewRequest;
import com.example.Rental.dto.request.ReviewRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.ReviewResponse;
import com.example.Rental.service.ReviewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/rooms/{roomId}/reviews")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getRoomReviews(@PathVariable Long roomId) {
        List<ReviewResponse> response = reviewService.getApprovedRoomReviews(roomId)
                .stream()
                .map(ReviewResponse::fromEntity)
                .collect(Collectors.toList());
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
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getRenterReviews(@PathVariable Long userId) {
        List<ReviewResponse> response = reviewService.getApprovedRenterReviews(userId)
                .stream()
                .map(ReviewResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok("Renter reviews retrieved", response));
    }
}
