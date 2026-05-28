package com.example.Rental.service;

import com.example.Rental.config.CacheConstants;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.Rental.dto.request.UpdateProfileRequest;
import com.example.Rental.dto.response.RenterLookupResponse;
import com.example.Rental.dto.response.UserListResponse;
import com.example.Rental.dto.response.UserResponse;
import com.example.Rental.entity.User;
import com.example.Rental.enums.UserRole;
import com.example.Rental.enums.UserStatus;
import com.example.Rental.enums.NotificationType;
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
    private final NotificationService notificationService;

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Cacheable(cacheNames = CacheConstants.USER_PROFILE, keyGenerator = "currentUserKeyGenerator")
    public UserResponse getProfile() {
        User user = getCurrentUser();
        return mapToResponse(user);
    }

    @CacheEvict(cacheNames = CacheConstants.USER_PROFILE, keyGenerator = "currentUserKeyGenerator")
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

        // Gửi thông báo WebSocket realtime
        if (saved.getStatus() == UserStatus.ACTIVE) {
            notificationService.createAndSendNotification(
                    saved,
                    NotificationType.ACCOUNT_APPROVED,
                    "Tài khoản đã được duyệt",
                    "Tài khoản của bạn đã được quản trị viên duyệt thành công.",
                    "user",
                    saved.getId()
            );
        } else if (saved.getStatus() == UserStatus.BANNED) {
            notificationService.createAndSendNotification(
                    saved,
                    NotificationType.ACCOUNT_BANNED,
                    "Tài khoản đã bị khóa",
                    "Tài khoản của bạn đã bị khóa bởi quản trị viên.",
                    "user",
                    saved.getId()
            );
        }

        return mapToResponse(saved);
    }

    // New: list users with optional filters role and status, pageable
    public UserListResponse listUsers(UserRole role, UserStatus status, int page, int limit) {
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 10;
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

        // Gửi thông báo WebSocket realtime
        if (saved.getStatus() == UserStatus.ACTIVE) {
            notificationService.createAndSendNotification(
                    saved,
                    NotificationType.ACCOUNT_APPROVED,
                    "Tài khoản đã được duyệt",
                    "Tài khoản của bạn đã được quản trị viên duyệt thành công.",
                    "user",
                    saved.getId()
            );
        } else if (saved.getStatus() == UserStatus.BANNED) {
            notificationService.createAndSendNotification(
                    saved,
                    NotificationType.ACCOUNT_BANNED,
                    "Tài khoản đã bị khóa",
                    "Tài khoản của bạn đã bị khóa bởi quản trị viên.",
                    "user",
                    saved.getId()
            );
        }

        return mapToResponse(saved);
    }

    public List<UserResponse> searchRenters(String q) {
        if (q == null || q.isBlank()) return List.of();
        Pageable limit = PageRequest.of(0, 8, Sort.by("fullName"));
        return userRepository.searchRenters(q.trim(), limit)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Privacy-preserving renter lookup for contract drafting.
     * Requires an EXACT email match (no fuzzy enumeration) and returns only
     * the id plus masked previews — enough for the owner to confirm the right
     * account without exposing the renter's PII before they accept the contract.
     */
    public RenterLookupResponse findRenterByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }
        String normalized = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalized)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người thuê với email này"));
        if (user.getRole() != UserRole.RENTER) {
            throw new RuntimeException("Tài khoản này không phải người thuê");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("Tài khoản người thuê chưa được xác thực");
        }
        return RenterLookupResponse.builder()
                .id(user.getId())
                .maskedEmail(maskEmail(user.getEmail()))
                .maskedName(maskName(user.getFullName()))
                .build();
    }

    private static String maskEmail(String email) {
        if (email == null) return null;
        int at = email.indexOf('@');
        if (at <= 1) return "***" + (at >= 0 ? email.substring(at) : "");
        String local = email.substring(0, at);
        String visible = local.substring(0, Math.min(2, local.length()));
        return visible + "***" + email.substring(at);
    }

    private static String maskName(String name) {
        if (name == null || name.isBlank()) return "—";
        String[] parts = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) sb.append(' ');
            String p = parts[i];
            if (p.length() <= 1) {
                sb.append(p);
            } else if (i == parts.length - 1) {
                // Keep last name (e.g. surname) visible for confirmation
                sb.append(p);
            } else {
                sb.append(p.charAt(0)).append('.');
            }
        }
        return sb.toString();
    }
}
