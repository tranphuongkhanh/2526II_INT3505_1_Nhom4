package com.example.Rental.service;

import com.example.Rental.config.CacheConstants;
import com.example.Rental.dto.response.CursorPageResponse;
import com.example.Rental.dto.response.NotificationResponse;
import com.example.Rental.entity.Notification;
import com.example.Rental.enums.NotificationType;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.entity.User;
import com.example.Rental.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    /** Notification types that are no longer created and should be hidden from all queries. */
    private static final List<NotificationType> EXCLUDED_TYPES = List.of(NotificationType.NEW_MESSAGE);

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public CursorPageResponse<NotificationResponse> getUserNotifications(Long userId, Long cursor, int limit, List<NotificationType> types) {
        Pageable pageable = PageRequest.of(0, limit + 1);
        List<Notification> notifications;

        boolean hasFilter = (types != null && !types.isEmpty());

        // Loại bỏ các type bị loại trừ khỏi danh sách lọc (nếu có)
        if (hasFilter) {
            types = types.stream()
                    .filter(t -> !EXCLUDED_TYPES.contains(t))
                    .collect(Collectors.toList());
            hasFilter = !types.isEmpty();
        }

        if (cursor == null) {
            if (hasFilter) {
                notifications = notificationRepository.findByUserIdAndTypeInOrderByIdDesc(userId, types, pageable);
            } else {
                notifications = notificationRepository.findByUserIdAndTypeNotInOrderByCreatedAtDesc(userId, EXCLUDED_TYPES, pageable);
            }
        } else {
            if (hasFilter) {
                notifications = notificationRepository.findByUserIdAndTypeInAndIdLessThanOrderByIdDesc(userId, types, cursor, pageable);
            } else {
                notifications = notificationRepository.findByUserIdAndTypeNotInAndIdLessThanOrderByCreatedAtDesc(userId, EXCLUDED_TYPES, cursor, pageable);
            }
        }

        Long nextCursor = null;

        if (notifications.size() > limit) {
            nextCursor = notifications.get(limit - 1).getId();

            // Cắt bỏ cái phần tử "thăm dò" bị dư ra để trả về đúng số lượng Frontend yêu cầu
            notifications = notifications.subList(0, limit);
        }

        List<NotificationResponse> items = notifications.stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());

        return new CursorPageResponse<>(items, nextCursor);
    }

    @Cacheable(cacheNames = CacheConstants.NOTIFICATION_UNREAD_COUNT, key = "#userId")
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalseAndTypeNotIn(userId, EXCLUDED_TYPES);
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConstants.NOTIFICATION_UNREAD_COUNT, key = "#userId")
    public NotificationResponse markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông báo hoặc bạn không có quyền truy cập!"));

        notification.setIsRead(true);
        Notification updatedNotification = notificationRepository.save(notification);

        return NotificationResponse.fromEntity(updatedNotification);
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConstants.NOTIFICATION_UNREAD_COUNT, key = "#userId")
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(notif -> !notif.getIsRead() && !EXCLUDED_TYPES.contains(notif.getType()))
                .collect(Collectors.toList());

        unreadNotifications.forEach(notif -> notif.setIsRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông báo!"));

        notificationRepository.delete(notification);
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConstants.NOTIFICATION_UNREAD_COUNT, key = "#user.id")
    public NotificationResponse createAndSendNotification(
            User user,
            NotificationType type,
            String title,
            String content,
            String relatedEntityType,
            Long relatedEntityId
    ) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .content(content)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        NotificationResponse response = NotificationResponse.fromEntity(notification);

        try {
            messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/notifications", response);
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification to user: {}", user.getEmail(), e);
        }

        return response;
    }
}