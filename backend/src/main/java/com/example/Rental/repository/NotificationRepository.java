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

    // Khi lấy trang đầu tiên (cursor = null)
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Khi lấy các trang tiếp theo dựa trên cursor (ID của thông báo cuối cùng trước đó)
    List<Notification> findByUserIdAndIdLessThanOrderByCreatedAtDesc(Long userId, Long cursor, Pageable pageable);

    // Cho lần lướt đầu tiên (có lọc)
    List<Notification> findByUserIdAndTypeInOrderByIdDesc(Long userId, List<NotificationType> types, Pageable pageable);

    // Cho các lần cuộn trang tiếp theo (có lọc)
    List<Notification> findByUserIdAndTypeInAndIdLessThanOrderByIdDesc(Long userId, List<NotificationType> types, Long cursor, Pageable pageable);

    boolean existsByUserIdAndTypeAndRelatedEntityId(Long userId, NotificationType type, Long relatedEntityId);
}
