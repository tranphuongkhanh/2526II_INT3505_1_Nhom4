package com.example.Rental.dto.response;

import java.time.LocalDateTime;

import com.example.Rental.entity.Review;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {

    private Long id;
    
    @JsonProperty("review_type")
    private String reviewType;
    
    @JsonProperty("reviewer_id")
    private Long reviewerId;
    
    @JsonProperty("reviewer_name")
    private String reviewerName;
    
    @JsonProperty("reviewer_avatar")
    private String reviewerAvatar;
    
    @JsonProperty("target_room_id")
    private Long targetRoomId;
    
    @JsonProperty("target_user_id")
    private Long targetUserId;
    
    @JsonProperty("contract_id")
    private Long contractId;
    
    private Integer rating;
    
    private String comment;
    
    private String status;
    
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    public static ReviewResponse fromEntity(Review review) {
        if (review == null) return null;
        return ReviewResponse.builder()
                .id(review.getId())
                .reviewType(review.getReviewType() != null ? review.getReviewType().name() : null)
                .reviewerId(review.getReviewer() != null ? review.getReviewer().getId() : null)
                .reviewerName(review.getReviewer() != null ? review.getReviewer().getFullName() : null)
                .reviewerAvatar(review.getReviewer() != null ? review.getReviewer().getAvatarUrl() : null)
                .targetRoomId(review.getTargetRoom() != null ? review.getTargetRoom().getId() : null)
                .targetUserId(review.getTargetUser() != null ? review.getTargetUser().getId() : null)
                .contractId(review.getContract() != null ? review.getContract().getId() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .status(review.getStatus() != null ? review.getStatus().name() : null)
                .createdAt(review.getCreatedAt())
                .build();
    }
}
