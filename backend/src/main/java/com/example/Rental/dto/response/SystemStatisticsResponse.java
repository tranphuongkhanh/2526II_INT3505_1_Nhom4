package com.example.Rental.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class SystemStatisticsResponse {
    private long totalUsers;
    private long totalRooms;
    private Map<String, Long> postsByStatus;
    private Map<String, Long> usersByRole;
    private Map<String, Long> usersByStatus;
    private long pendingReviews;
    private long pendingReports;
}
