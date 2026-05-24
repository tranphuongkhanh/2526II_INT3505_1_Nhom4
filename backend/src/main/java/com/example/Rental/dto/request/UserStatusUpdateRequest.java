package com.example.Rental.dto.request;

import com.example.Rental.enums.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserStatusUpdateRequest {
    @NotNull
    private UserStatus status;
}

