package com.example.Rental.dto.response;

import java.time.LocalDateTime;

import com.example.Rental.entity.Report;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportResponse {
    private Long id;
    
    @JsonProperty("post_id")
    private Long postId;
    
    @JsonProperty("reporter_id")
    private Long reporterId;
    
    @JsonProperty("reporter_name")
    private String reporterName;
    
    @JsonProperty("reporter_email")
    private String reporterEmail;
    
    private String reason;
    private String status;
    private String resolution;
    
    @JsonProperty("handled_by")
    private Long handledById;
    
    @JsonProperty("handled_at")
    private LocalDateTime handledAt;
    
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    public static ReportResponse fromEntity(Report report) {
        if (report == null) return null;
        
        return ReportResponse.builder()
                .id(report.getId())
                .postId(report.getPost() != null ? report.getPost().getId() : null)
                .reporterId(report.getReporter() != null ? report.getReporter().getId() : null)
                .reporterName(report.getReporter() != null ? report.getReporter().getFullName() : null)
                .reporterEmail(report.getReporter() != null ? report.getReporter().getEmail() : null)
                .reason(report.getReason())
                .status(report.getStatus() != null ? report.getStatus().name() : null)
                .resolution(report.getResolution())
                .handledById(report.getHandledBy() != null ? report.getHandledBy().getId() : null)
                .handledAt(report.getHandledAt())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
