package com.example.Rental.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.Rental.dto.request.UpdateProfileRequest;
import com.example.Rental.dto.response.UserListResponse;
import com.example.Rental.dto.response.UserResponse;
import com.example.Rental.entity.User;
import com.example.Rental.enums.UserRole;
import com.example.Rental.enums.UserStatus;
import com.example.Rental.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public UserResponse getProfile() {
        User user = getCurrentUser();
        return mapToResponse(user);
    }

    public UserResponse updateProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();

        // Chỉ cập nhật field nào client gửi lên (không null)
        // Dùng pattern này để client có thể gửi 1 field
        // mà không làm mất các field khác

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        if (user.getRole() == UserRole.OWNER) {

            if (request.getCitizenId() != null) {
                user.setCitizenId(request.getCitizenId());
            }

            if (request.getPermanentAddress() != null) {
                user.setPermanentAddress(request.getPermanentAddress());
            }
        }

        User saved = userRepository.save(user);
        log.info("Profile updated for user: {}", user.getEmail());

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
                .createdAt(user.getCreatedAt())
                .build();
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public UserResponse updateUserStatus(Long id, String statusStr) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(UserStatus.valueOf(statusStr.toUpperCase()));
        User saved = userRepository.save(user);
        log.info("Admin updated status of user {} to {}", id, statusStr);
        return mapToResponse(saved);
    }

    // New: list users with optional filters role and status, pageable
    public UserListResponse listUsers(UserRole role, UserStatus status, int page, int limit) {
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<User> result;

        if (role != null && status != null) {
            result = userRepository.findByRoleAndStatus(role, status, pageable);
        } else if (role != null) {
            result = userRepository.findByRole(role, pageable);
        } else if (status != null) {
            result = userRepository.findByStatus(status, pageable);
        } else {
            result = userRepository.findAll(pageable);
        }

        List<UserResponse> items = result.getContent().stream().map(this::mapToResponse).collect(Collectors.toList());

        return UserListResponse.builder()
                .total(result.getTotalElements())
                .page(page)
                .limit(limit)
                .items(items)
                .build();
    }

    // New: update user status (approve/ban/unban)
    public UserResponse updateUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(status);
        User saved = userRepository.save(user);
        log.info("User {} status updated to {}", user.getEmail(), status);
        return mapToResponse(saved);
    }
}
