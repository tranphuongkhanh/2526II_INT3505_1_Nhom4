package com.example.Rental.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Value;

import com.example.Rental.dto.request.LoginRequest;
import com.example.Rental.dto.request.RegisterRequest;
import com.example.Rental.dto.request.ForgotPasswordRequest;
import com.example.Rental.dto.request.ResetPasswordRequest;
import com.example.Rental.dto.request.ChangePasswordRequest;

import com.example.Rental.dto.response.LoginResponse;
import com.example.Rental.dto.response.UserResponse;

import com.example.Rental.entity.User;

import com.example.Rental.enums.UserRole;
import com.example.Rental.enums.UserStatus;

import com.example.Rental.repository.UserRepository;

import com.example.Rental.util.JwtUtil;

import com.example.Rental.service.TokenBlacklistService;
import com.example.Rental.service.EmailService;
import com.example.Rental.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;
    private final EmailService emailService;
    private final UserService userService;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${app.reset-token.expiration-minutes:30}")
    private int resetTokenExpirationMinutes;

    public UserResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        UserRole userRole = UserRole.valueOf(request.getRole().toUpperCase());

        if (userRole == UserRole.OWNER) {
            if (request.getCitizenId() == null || request.getCitizenId().isBlank()) {
                throw new RuntimeException("Citizen ID is required for owner");
            }

            if (request.getPermanentAddress() == null || request.getPermanentAddress().isBlank()) {
                throw new RuntimeException("Address is required for owner");
            }
        }

        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .citizenId(request.getCitizenId())
                .permanentAddress(request.getPermanentAddress())
                .role(userRole)
                // Owner → PENDING chờ admin duyệt
                // Renter → ACTIVE dùng ngay
                .status(userRole == UserRole.OWNER
                        ? UserStatus.PENDING
                        : UserStatus.ACTIVE)
                .build();

        // 5. Lưu vào DB
        User saved = userRepository.save(user);

        // 6. Trả về DTO (không trả Entity trực tiếp)
        return mapToResponse(saved);

    }

    public UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .citizenId(user.getCitizenId())
                .permanentAddress(user.getPermanentAddress())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .build();
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email or password is not correct"));

        boolean passwordMatch = passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash());

        if (!passwordMatch) {
            throw new RuntimeException("Email or password is not correct");
        }

        if (user.getStatus() == UserStatus.BANNED) {
            throw new RuntimeException("Your account has been banned." + "Please contact admin for more information");
        }

        if (user.getStatus() == UserStatus.PENDING) {
            throw new RuntimeException(
                    "Your account is pending approval." + "Please contact admin for more information");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());

        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtExpiration)
                .user(mapToResponse(user))
                .build();
    }

    public void logout(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid authorization header");
        }

        String token = authHeader.substring(7);

        if (tokenBlacklistService.isTokenBlacklisted(token)) {
            throw new RuntimeException("Token is already logout");
        }

        tokenBlacklistService.addToBlacklist(token);
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (user == null) {
            // Giả vờ thành công để tránh email enumeration attack
            log.warn("Forgot password requested for unknown email: {}",
                    request.getEmail());
            return;
        }

        // 2. Tạo reset token ngẫu nhiên
        String resetToken = UUID.randomUUID().toString().replace("-", "");

        // 3. Lưu token + thời gian hết hạn vào DB
        user.setResetToken(resetToken);
        user.setResetTokenExpires(
                LocalDateTime.now().plusMinutes(resetTokenExpirationMinutes));
        userRepository.save(user);

        // 4. Gửi email bất đồng bộ (không block request)
        emailService.sendResetPasswordEmail(
                user.getEmail(),
                user.getFullName(),
                resetToken);

        log.info("Reset password token generated for user: {}",
                user.getEmail());
    }

    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New password and confirm password do not match.");
        }

        User user = userRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        if (user.getResetTokenExpires() == null || user.getResetTokenExpires().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Invalid or expired reset token");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpires(null);
        userRepository.save(user);

        log.info("Password reset successfully for user: {}", user.getEmail());
    }

    public void changePassword(ChangePasswordRequest request) {
        User user = userService.getCurrentUser();

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Incorrect current password");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new RuntimeException("New password cannot be the same as old password");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New password and confirm password do not match.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Password changed successfully for user: {}", user.getEmail());
    }
}
