package com.example.Rental.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Size(min = 2, max = 150, message = "Full name must be between 2 and 150 characters")
    private String fullName;

    @Size(min = 10, max = 11, message = "Phone number must be between 10 and 11 digits")
    private String phone;

    // Only owner can update these fields
    private String citizenId;
    private String permanentAddress;
}
