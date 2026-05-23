package com.example.Rental.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.Rental.enums.PostStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OwnerPostResponse {
    private Long id;
    private String roomTitle;
    private PostStatus status;
    private String rejectReason; 
    private BigDecimal listingFee;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer viewCount;
    private Integer favoriteCount;
    private LocalDateTime createdAt;
}