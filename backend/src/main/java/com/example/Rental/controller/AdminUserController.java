package com.example.Rental.controller;

import com.example.Rental.dto.request.UpdateUserStatusRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.UserResponse;
import com.example.Rental.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok("Users retrieved successfully", users));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        UserResponse updated = userService.updateUserStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.ok("User status updated successfully", updated));
    }
}
