package com.example.Rental.dto.response;

import java.time.LocalDateTime;

import com.example.Rental.enums.PostStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminPostResponse {
    private Long id;
    private String roomTitle;
    private String ownerName;
    private String ownerEmail;
    private PostStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String rejectReason;
    private String approvedByEmail;
    private LocalDateTime approvedAt;
}