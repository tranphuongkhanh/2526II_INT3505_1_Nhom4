package com.example.Rental.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemStatisticsResponse {
    private long totalUsers;
    private long totalRooms;
    private Map<String, Long> postsByStatus;
    private Map<String, Long> usersByRole;
    private Map<String, Long> usersByStatus;
    private long pendingReviews;
    private long pendingReports;
}
