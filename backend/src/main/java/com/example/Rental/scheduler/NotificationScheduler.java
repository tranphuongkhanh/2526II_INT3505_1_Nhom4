package com.example.Rental.scheduler;

import com.example.Rental.entity.Post;
import com.example.Rental.enums.NotificationType;
import com.example.Rental.enums.PostStatus;
import com.example.Rental.repository.PostRepository;
import com.example.Rental.repository.NotificationRepository;
import com.example.Rental.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class NotificationScheduler {

    private final PostRepository postRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    // Chạy định kỳ mỗi 6 tiếng
    @Scheduled(cron = "0 0 */6 * * ?")
    public void checkExpiringPosts() {
        log.info("Starting background check for expiring posts...");
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusDays(2); // 48 giờ sắp hết hạn

        List<Post> expiringPosts = postRepository.findByStatusAndEndDateBetween(PostStatus.APPROVED, now, threshold);
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        int count = 0;

        for (Post post : expiringPosts) {
            // Kiểm tra xem đã gửi thông báo POST_EXPIRING cho bài viết này chưa
            boolean alreadyNotified = notificationRepository.existsByUserIdAndTypeAndRelatedEntityId(
                    post.getCreatedBy().getId(),
                    NotificationType.POST_EXPIRING,
                    post.getId()
            );

            if (!alreadyNotified) {
                String formattedDate = post.getEndDate().format(formatter);
                notificationService.createAndSendNotification(
                        post.getCreatedBy(),
                        NotificationType.POST_EXPIRING,
                        "Bài đăng sắp hết hạn",
                        "Bài đăng cho phòng '" + post.getRoom().getTitle() + "' sắp hết hạn vào lúc " + formattedDate + ". Vui lòng gia hạn để duy trì hiển thị.",
                        "post",
                        post.getId()
                );
                count++;
            }
        }

        log.info("Background check for expiring posts completed. Sent {} notifications.", count);
    }
}
