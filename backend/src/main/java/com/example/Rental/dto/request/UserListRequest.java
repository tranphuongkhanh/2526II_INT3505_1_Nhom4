package com.example.Rental.dto.request;

import com.example.Rental.enums.UserRole;
import com.example.Rental.enums.UserStatus;
import lombok.Data;

@Data
public class UserListRequest {
    private UserRole role;
    private UserStatus status;
    private Integer page = 1;
    private Integer limit = 10;
}

