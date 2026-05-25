package com.example.Rental.dto.request;

import lombok.Data;

@Data
public class VehicleRequest {
    private String licensePlate;
    private String vehicleType;
    private Long renterId; // optional
    private String imageUrl;
}

