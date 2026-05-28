package com.example.Rental.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostSummaryResponse {
    private Long id;
    private String roomTitle;
    private BigDecimal price;
    private Double areaMq;
    private String city;
    private String district;
    private String thumbnailImage; 
    private Integer viewCount;
    private LocalDateTime createdAt;
}