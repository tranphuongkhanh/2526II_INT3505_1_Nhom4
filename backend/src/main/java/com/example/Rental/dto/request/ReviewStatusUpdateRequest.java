package com.example.Rental.dto.request;

import com.example.Rental.enums.ReviewStatus;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private ReviewStatus status;
}
