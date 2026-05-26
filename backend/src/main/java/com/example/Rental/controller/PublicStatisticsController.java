package com.example.Rental.controller;

import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.PublicStatisticsResponse;
import com.example.Rental.enums.PostStatus;
import com.example.Rental.enums.UserRole;
import com.example.Rental.repository.PostRepository;
import com.example.Rental.repository.RoomRepository;
import com.example.Rental.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/statistics")
@RequiredArgsConstructor
public class PublicStatisticsController {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<PublicStatisticsResponse>> getStatistics() {
        PublicStatisticsResponse stats = PublicStatisticsResponse.builder()
                .totalRooms(roomRepository.countByDeletedAtIsNull())
                .totalOwners(userRepository.countByRole(UserRole.OWNER))
                .totalRenters(userRepository.countByRole(UserRole.RENTER))
                .totalActivePosts(postRepository.countByStatus(PostStatus.APPROVED))
                .build();
        return ResponseEntity.ok(ApiResponse.ok("Public statistics retrieved successfully", stats));
    }
}
