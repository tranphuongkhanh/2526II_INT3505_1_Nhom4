package com.example.Rental.repository;

import com.example.Rental.entity.Review;
import com.example.Rental.enums.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByTargetRoomIdAndStatus(Long roomId, ReviewStatus status);
    List<Review> findByTargetUserIdAndStatus(Long userId, ReviewStatus status);
    List<Review> findByStatus(ReviewStatus status);
}
