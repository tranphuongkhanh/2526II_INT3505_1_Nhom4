package com.example.Rental.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rental.dto.request.ForgotPasswordRequest;
import com.example.Rental.dto.request.LoginRequest;
import com.example.Rental.dto.request.RegisterRequest;
import com.example.Rental.dto.request.ResetPasswordRequest;
import com.example.Rental.dto.request.ChangePasswordRequest;

import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.LoginResponse;
import com.example.Rental.dto.response.UserResponse;

import com.example.Rental.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
        private final AuthService authService;

        @PostMapping("/register")
        public ResponseEntity<ApiResponse<UserResponse>> register(
                        @Valid @RequestBody RegisterRequest request) {

                UserResponse data = authService.register(request);
                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(ApiResponse.ok("Register successfully", data));
        }

        @PostMapping("/login")
        public ResponseEntity<ApiResponse<LoginResponse>> login(
                        @Valid @RequestBody LoginRequest request) {

                LoginResponse data = authService.login(request);
                return ResponseEntity.ok(
                                ApiResponse.ok("Login successfully", data));
        }

        @PostMapping("/logout")
        public ResponseEntity<ApiResponse<Void>> logout(
                        @RequestHeader("Authorization") String authHeader) {
                authService.logout(authHeader);
                return ResponseEntity.ok(
                                ApiResponse.ok("Logout successfully", null));
        }

        @PostMapping("/forgot-password")
        public ResponseEntity<ApiResponse<Void>> forgotPassword(
                        @Valid @RequestBody ForgotPasswordRequest request) {

                authService.forgotPassword(request);

                return ResponseEntity.ok(
                                ApiResponse.ok(
                                                "If your email exists in the system, you will "
                                                                + "receive instructions within a few minutes.",
                                                null));
        }

        @PostMapping("/reset-password")
        public ResponseEntity<ApiResponse<Void>> resetPassword(
                        @Valid @RequestBody ResetPasswordRequest request) {
                authService.resetPassword(request);
                return ResponseEntity.ok(
                                ApiResponse.ok("Password reset successfully.", null));
        }

        @PostMapping("/change-password")
        public ResponseEntity<ApiResponse<Void>> changePassword(
                        @Valid @RequestBody ChangePasswordRequest request) {
                authService.changePassword(request);
                return ResponseEntity.ok(
                                ApiResponse.ok("Password changed successfully.", null));
        }

}
