package com.example.Rental.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PublicStatisticsResponse {
    private long totalRooms;
    private long totalOwners;
    private long totalRenters;
    private long totalActivePosts;
}
