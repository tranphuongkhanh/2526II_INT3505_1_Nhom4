package com.example.Rental.service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.Rental.dto.request.UpdateProfileRequest;
import com.example.Rental.dto.response.UserResponse;
import com.example.Rental.entity.User;
import com.example.Rental.enums.UserRole;
import com.example.Rental.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
                .build();
    }
}
