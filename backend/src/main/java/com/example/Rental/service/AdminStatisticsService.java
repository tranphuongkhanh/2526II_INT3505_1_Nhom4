package com.example.Rental.service;

import com.example.Rental.dto.response.SystemStatisticsResponse;
import com.example.Rental.enums.PostStatus;
import com.example.Rental.enums.ReportStatus;
import com.example.Rental.enums.ReviewStatus;
import com.example.Rental.enums.UserRole;
import com.example.Rental.enums.UserStatus;
import com.example.Rental.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminStatisticsService {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final PostRepository postRepository;
    private final ReviewRepository reviewRepository;
    private final ReportRepository reportRepository;

    @Transactional(readOnly = true)
    public SystemStatisticsResponse getSystemStatistics() {
        long totalUsers = userRepository.count();
        long totalRooms = roomRepository.countByDeletedAtIsNull();

        Map<String, Long> postsByStatus = new HashMap<>();
        for (PostStatus status : PostStatus.values()) {
            postsByStatus.put(status.name(), postRepository.countByStatus(status));
        }

        Map<String, Long> usersByRole = new HashMap<>();
        usersByRole.put(UserRole.RENTER.name(), userRepository.countByRole(UserRole.RENTER));
        usersByRole.put(UserRole.OWNER.name(), userRepository.countByRole(UserRole.OWNER));

        Map<String, Long> usersByStatus = new HashMap<>();
        for (UserStatus status : UserStatus.values()) {
            usersByStatus.put(status.name(), userRepository.countByStatus(status));
        }

        long pendingReviews = reviewRepository.countByStatus(ReviewStatus.PENDING);
        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);

        return SystemStatisticsResponse.builder()
                .totalUsers(totalUsers)
                .totalRooms(totalRooms)
                .postsByStatus(postsByStatus)
                .usersByRole(usersByRole)
                .usersByStatus(usersByStatus)
                .pendingReviews(pendingReviews)
                .pendingReports(pendingReports)
                .build();
    }
}
