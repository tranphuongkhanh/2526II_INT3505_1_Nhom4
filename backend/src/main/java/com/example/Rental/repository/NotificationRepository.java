package com.example.Rental.repository;

import com.example.Rental.entity.Notification;
import com.example.Rental.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndIsReadFalse(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    // Khi lấy trang đầu tiên (cursor = null), loại trừ các loại không mong muốn
    List<Notification> findByUserIdAndTypeNotInOrderByCreatedAtDesc(Long userId, List<NotificationType> excludedTypes, Pageable pageable);

    // Khi lấy các trang tiếp theo dựa trên cursor, loại trừ các loại không mong muốn
    List<Notification> findByUserIdAndTypeNotInAndIdLessThanOrderByCreatedAtDesc(Long userId, List<NotificationType> excludedTypes, Long cursor, Pageable pageable);

    // Đếm số thông báo chưa đọc, loại trừ các loại không mong muốn
    long countByUserIdAndIsReadFalseAndTypeNotIn(Long userId, List<NotificationType> excludedTypes);

    // Cho lần lướt đầu tiên (có lọc)
    List<Notification> findByUserIdAndTypeInOrderByIdDesc(Long userId, List<NotificationType> types, Pageable pageable);

    // Cho các lần cuộn trang tiếp theo (có lọc)
    List<Notification> findByUserIdAndTypeInAndIdLessThanOrderByIdDesc(Long userId, List<NotificationType> types, Long cursor, Pageable pageable);

    boolean existsByUserIdAndTypeAndRelatedEntityId(Long userId, NotificationType type, Long relatedEntityId);
}
