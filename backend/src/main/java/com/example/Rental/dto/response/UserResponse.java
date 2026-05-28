package com.example.Rental.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
    private LocalDateTime createdAt;
}