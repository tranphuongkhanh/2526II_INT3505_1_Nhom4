package com.example.Rental.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.Rental.dto.request.UpdateProfileRequest;
import com.example.Rental.dto.request.UserStatusUpdateRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.UserListResponse;
import com.example.Rental.dto.response.UserResponse;
import java.util.List;
import com.example.Rental.service.UserService;
import com.example.Rental.enums.UserRole;
import com.example.Rental.enums.UserStatus;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserResponse>>> searchRenters(@RequestParam String q) {
        List<UserResponse> results = userService.searchRenters(q);
        return ResponseEntity.ok(ApiResponse.ok("Search results", results));
    }

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

    // Admin: list users with optional filters role & status and pagination
    @GetMapping
    public ResponseEntity<ApiResponse<UserListResponse>> listUsers(
            @RequestParam(value = "role", required = false) UserRole role,
            @RequestParam(value = "status", required = false) UserStatus status,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            Authentication authentication
    ) {
        // require admin
        if (!hasAdminRole(authentication.getAuthorities())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied"));
        }

        UserListResponse data = userService.listUsers(role, status, page, limit);
        return ResponseEntity.ok(ApiResponse.ok("List users retrieved", data));
    }

    // Admin: update user status (approve/ban/unban)
    @PatchMapping("/{userId}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UserStatusUpdateRequest request,
            Authentication authentication
    ) {
        if (!hasAdminRole(authentication.getAuthorities())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied"));
        }

        UserResponse data = userService.updateUserStatus(userId, request.getStatus());
        return ResponseEntity.ok(ApiResponse.ok("User status updated", data));
    }

    private boolean hasAdminRole(Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null) return false;
        return authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
