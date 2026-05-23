package com.example.Rental.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rental.dto.request.UpdateProfileRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.UserResponse;
import com.example.Rental.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile() {
        UserResponse data = userService.getProfile();
        return ResponseEntity.ok(ApiResponse.ok("Get profile successfully", data));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse data = userService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.ok("Update profile successfully", data));
    }
}
