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
public class PostStatisticsResponse {
    private Long postId;
    private long favoriteCount;
    private long totalViews;
    private Map<String, Long> viewsByDay;
    private Map<Integer, Long> viewsByHour;
    private Integer peakHour;
    private String peakDay;
}
