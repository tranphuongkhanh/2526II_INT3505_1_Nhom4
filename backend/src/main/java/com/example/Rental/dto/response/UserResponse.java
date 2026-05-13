package com.example.Rental.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private String username;
    private String fullName;
    private String phone;
    private String citizenId;
    private String permanentAddress;
    private String avatarUrl;
    private String role;
    private String status;
    // KHÔNG có passwordHash, resetToken
}