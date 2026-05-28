package com.example.Rental.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {

    @NotBlank(message = "Google credential is required")
    private String credential;

    private String role; // RENTER, OWNER, etc. (defaults to RENTER if not provided)
}
