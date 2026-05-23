package com.example.Rental.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Rental.dto.request.RenterReviewRequest;
import com.example.Rental.dto.request.ReviewRequest;
import com.example.Rental.entity.RentalContract;
import com.example.Rental.entity.Review;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.enums.ReviewStatus;
import com.example.Rental.enums.ReviewType;
import com.example.Rental.enums.UserStatus;
import com.example.Rental.repository.RentalContractRepository;
import com.example.Rental.repository.ReviewRepository;
import com.example.Rental.repository.RoomRepository;
import com.example.Rental.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final RentalContractRepository contractRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;

    @Transactional
    public void createRoomReview(Long roomId, ReviewRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("User account is not active");
        }

        RentalContract contract = contractRepository.findById(request.getContractId())
                .orElseThrow(() -> new RuntimeException("Contract not found"));

        if (!contract.getRoom().getId().equals(roomId)) {
            throw new RuntimeException("Contract does not belong to this room");
        }

        if (!contract.getRenter().getId().equals(user.getId())) {
            throw new RuntimeException("You are not the renter of this contract");
        }

        if (reviewRepository.existsByContractIdAndReviewType(contract.getId(), ReviewType.RENTER_TO_ROOM)) {
            throw new RuntimeException("You have already reviewed this room for this contract");
        }

        Review review = Review.builder()
                .reviewType(ReviewType.RENTER_TO_ROOM)
                .reviewer(user)
                .targetRoom(contract.getRoom())
                .contract(contract)
                .rating(request.getRating())
                .comment(request.getComment())
                .status(ReviewStatus.PENDING)
                .build();

        reviewRepository.save(review);
    }

    @Transactional
    public void createRenterReview(Long contractId, RenterReviewRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("User account is not active");
        }

        RentalContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));

        if (!contract.getRoom().getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("You are not the owner of this room");
        }

        if (contract.getStatus() != com.example.Rental.enums.ContractStatus.ENDED) {
            throw new RuntimeException("You can only review the renter after the contract has ended");
        }

        if (reviewRepository.existsByContractIdAndReviewType(contract.getId(), ReviewType.OWNER_TO_RENTER)) {
            throw new RuntimeException("You have already reviewed this renter for this contract");
        }

        Review review = Review.builder()
                .reviewType(ReviewType.OWNER_TO_RENTER)
                .reviewer(user)
                .targetUser(contract.getRenter())
                .contract(contract)
                .rating(request.getRating())
                .comment(request.getComment())
                .status(ReviewStatus.PENDING)
                .build();

        reviewRepository.save(review);
    }

    @Transactional(readOnly = true)
    public List<Review> getApprovedRoomReviews(Long roomId) {
        return reviewRepository.findByTargetRoomIdAndStatus(roomId, ReviewStatus.APPROVED);
    }

    @Transactional(readOnly = true)
    public List<Review> getApprovedRenterReviews(Long userId) {
        return reviewRepository.findByTargetUserIdAndStatus(userId, ReviewStatus.APPROVED);
    }

    @Transactional(readOnly = true)
    public List<Review> getPendingReviews() {
        return reviewRepository.findByStatus(ReviewStatus.PENDING);
    }

    @Transactional
    public void updateReviewStatus(Long reviewId, ReviewStatus status, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        review.setStatus(status);
        review.setModeratedBy(admin);
        review.setModeratedAt(LocalDateTime.now());
        
        reviewRepository.saveAndFlush(review);

        if (review.getReviewType() == ReviewType.RENTER_TO_ROOM) {
            Room room = review.getTargetRoom();
            List<Review> approvedReviews = reviewRepository.findByTargetRoomIdAndStatus(room.getId(), ReviewStatus.APPROVED);
            
            double avg = approvedReviews.stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(0.0);
            
            room.setAvgRating(avg);
            room.setReviewCount(approvedReviews.size());
            roomRepository.save(room);
        }
    }
}
