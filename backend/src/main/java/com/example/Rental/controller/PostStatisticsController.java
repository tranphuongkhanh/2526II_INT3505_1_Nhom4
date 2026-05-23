package com.example.Rental.controller;

import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.PostStatisticsResponse;
import com.example.Rental.service.PostStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/me/posts")
@RequiredArgsConstructor
public class PostStatisticsController {

    private final PostStatisticsService postStatisticsService;

    @GetMapping("/{postId}/statistics")
    public ResponseEntity<ApiResponse<PostStatisticsResponse>> getPostStatistics(
            @PathVariable Long postId,
            Principal principal) {
        PostStatisticsResponse stats = postStatisticsService.getPostStatistics(postId, principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("Thống kê bài đăng thành công", stats));
    }
}
