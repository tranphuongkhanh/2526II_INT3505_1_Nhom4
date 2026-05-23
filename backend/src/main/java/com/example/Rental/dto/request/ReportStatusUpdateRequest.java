package com.example.Rental.dto.request;

import com.example.Rental.enums.ReportStatus;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private ReportStatus status;

    private String resolution;
}
