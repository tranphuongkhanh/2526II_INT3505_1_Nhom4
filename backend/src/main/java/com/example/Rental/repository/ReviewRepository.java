package com.example.Rental.repository;

import com.example.Rental.entity.Review;
import com.example.Rental.enums.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByTargetRoomIdAndStatus(Long roomId, ReviewStatus status, Pageable pageable);
    List<Review> findByTargetRoomIdAndStatus(Long roomId, ReviewStatus status);
    Page<Review> findByTargetUserIdAndStatus(Long userId, ReviewStatus status, Pageable pageable);
    Page<Review> findByStatus(ReviewStatus status, Pageable pageable);
    boolean existsByContractIdAndReviewType(Long contractId, com.example.Rental.enums.ReviewType reviewType);
    java.util.Optional<Review> findByContractIdAndReviewType(Long contractId, com.example.Rental.enums.ReviewType reviewType);

    long countByStatus(ReviewStatus status);
}
