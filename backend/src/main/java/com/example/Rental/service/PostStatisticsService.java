package com.example.Rental.service;

import com.example.Rental.dto.response.PostStatisticsResponse;
import com.example.Rental.entity.Post;
import com.example.Rental.entity.PostView;
import com.example.Rental.entity.User;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.PostRepository;
import com.example.Rental.repository.PostViewRepository;
import com.example.Rental.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostStatisticsService {

    private final PostRepository postRepository;
    private final PostViewRepository postViewRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PostStatisticsResponse getPostStatistics(Long postId, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new EntityNotFoundException("User không tồn tại"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Bài đăng không tồn tại"));

        if (!post.getCreatedBy().getId().equals(owner.getId())) {
            throw new AccessDeniedException("Bạn không có quyền xem thống kê của bài đăng này");
        }

        List<PostView> views = postViewRepository.findByPostId(postId);

        // Group views by day (yyyy-MM-dd)
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        Map<String, Long> viewsByDay = views.stream()
                .collect(Collectors.groupingBy(
                        view -> view.getViewedAt().format(dayFormatter),
                        TreeMap::new, // Keep ordered by date
                        Collectors.counting()
                ));

        // Group views by hour (0-23)
        Map<Integer, Long> viewsByHour = views.stream()
                .collect(Collectors.groupingBy(
                        view -> view.getViewedAt().getHour(),
                        TreeMap::new, // Keep ordered by hour
                        Collectors.counting()
                ));

        // Populate empty hours to ensure all 24 hours are represented
        for (int i = 0; i < 24; i++) {
            viewsByHour.putIfAbsent(i, 0L);
        }

        // Determine peak hour
        Integer peakHour = viewsByHour.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        // Determine peak day
        String peakDay = viewsByDay.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        return PostStatisticsResponse.builder()
                .postId(postId)
                .favoriteCount(post.getFavoriteCount() != null ? post.getFavoriteCount() : 0)
                .totalViews(views.size())
                .viewsByDay(viewsByDay)
                .viewsByHour(viewsByHour)
                .peakHour(peakHour)
                .peakDay(peakDay)
                .build();
    }
}
