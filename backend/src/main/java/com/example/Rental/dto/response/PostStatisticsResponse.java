package com.example.Rental.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class PostStatisticsResponse {
    private Long postId;
    private long favoriteCount;
    private long totalViews;
    private Map<String, Long> viewsByDay;
    private Map<Integer, Long> viewsByHour;
    private Integer peakHour;
    private String peakDay;
}
