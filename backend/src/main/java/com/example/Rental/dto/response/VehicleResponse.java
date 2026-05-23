package com.example.Rental.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class VehicleResponse {
    private Long id;
    private Long roomId;
    private Long renterId;
    private String licensePlate;
    private String vehicleType;
    private String imageUrl;
    private LocalDateTime createdAt;
}

