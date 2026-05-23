package com.example.Rental.dto.request;

import com.example.Rental.enums.RentalStatus;
import lombok.Data;

@Data
public class RoomStatusUpdateRequest {
    private RentalStatus status;
}