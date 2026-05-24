package com.example.Rental.service;

import com.example.Rental.dto.response.CursorPageResponse;
import com.example.Rental.dto.response.NotificationResponse;
import com.example.Rental.entity.Notification;
import com.example.Rental.enums.NotificationType;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public CursorPageResponse<NotificationResponse> getUserNotifications(Long userId, Long cursor, int limit, List<NotificationType> types) {
        Pageable pageable = PageRequest.of(0, limit + 1);
        List<Notification> notifications;

        boolean hasFilter = (types != null && !types.isEmpty());

        if (cursor == null) {
            if (hasFilter) {
                notifications = notificationRepository.findByUserIdAndTypeInOrderByIdDesc(userId, types, pageable);
            } else {
                notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
            }
        } else {
            if (hasFilter) {
                notifications = notificationRepository.findByUserIdAndTypeInAndIdLessThanOrderByIdDesc(userId, types, cursor, pageable);
            } else {
                notifications = notificationRepository.findByUserIdAndIdLessThanOrderByCreatedAtDesc(userId, cursor, pageable);
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

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông báo hoặc bạn không có quyền truy cập!"));

        notification.setIsRead(true);
        Notification updatedNotification = notificationRepository.save(notification);

        return NotificationResponse.fromEntity(updatedNotification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(notif -> !notif.getIsRead())
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
}