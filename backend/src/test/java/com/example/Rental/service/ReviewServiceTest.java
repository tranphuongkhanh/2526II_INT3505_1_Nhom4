package com.example.Rental.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import com.example.Rental.dto.request.RenterReviewRequest;
import com.example.Rental.dto.request.ReviewRequest;
import com.example.Rental.entity.RentalContract;
import com.example.Rental.entity.Review;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.enums.ReviewStatus;
import com.example.Rental.enums.ReviewType;
import com.example.Rental.enums.UserStatus;
import com.example.Rental.repository.PostRepository;
import com.example.Rental.repository.RentalContractRepository;
import com.example.Rental.repository.ReviewRepository;
import com.example.Rental.repository.RoomRepository;
import com.example.Rental.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
public class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private RentalContractRepository contractRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ReviewService reviewService;

    private User user;
    private User owner;
    private Room room;
    private RentalContract contract;
    private String email = "renter@example.com";

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(2L);

        user = new User();
        user.setId(1L);
        user.setEmail(email);
        user.setStatus(UserStatus.ACTIVE);

        room = new Room();
        room.setId(1L);
        room.setOwner(owner);

        contract = new RentalContract();
        contract.setId(1L);
        contract.setRenter(user);
        contract.setRoom(room);
    }

    @Test
    void createRoomReview_Success() {
        ReviewRequest request = new ReviewRequest();
        request.setContractId(1L);
        request.setRating(5);
        request.setComment("Great room");

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(contractRepository.findById(1L)).thenReturn(Optional.of(contract));
        when(reviewRepository.findByContractIdAndReviewType(1L, ReviewType.RENTER_TO_ROOM)).thenReturn(Optional.empty());

        reviewService.createRoomReview(1L, request, email);

        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    void createRoomReview_ContractNotBelongToRoom() {
        Room otherRoom = new Room();
        otherRoom.setId(99L);
        contract.setRoom(otherRoom);

        ReviewRequest request = new ReviewRequest();
        request.setContractId(1L);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(contractRepository.findById(1L)).thenReturn(Optional.of(contract));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> reviewService.createRoomReview(1L, request, email));
        assertEquals("Contract does not belong to this room", exception.getMessage());
    }

    @Test
    void createRoomReview_NotRenter() {
        User otherUser = new User();
        otherUser.setId(99L);
        contract.setRenter(otherUser);

        ReviewRequest request = new ReviewRequest();
        request.setContractId(1L);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(contractRepository.findById(1L)).thenReturn(Optional.of(contract));

        AccessDeniedException exception = assertThrows(AccessDeniedException.class, () -> reviewService.createRoomReview(1L, request, email));
        assertEquals("You are not the renter of this contract", exception.getMessage());
    }

    @Test
    void createRenterReview_Success() {
        RenterReviewRequest request = new RenterReviewRequest();
        request.setRating(4);
        request.setComment("Good renter");

        owner.setEmail("owner@example.com");
        owner.setStatus(UserStatus.ACTIVE);
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(contractRepository.findById(1L)).thenReturn(Optional.of(contract));
        when(reviewRepository.findByContractIdAndReviewType(1L, ReviewType.OWNER_TO_RENTER)).thenReturn(Optional.empty());

        reviewService.createRenterReview(1L, request, "owner@example.com");

        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    void createRenterReview_NotOwner() {
        RenterReviewRequest request = new RenterReviewRequest();
        
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(contractRepository.findById(1L)).thenReturn(Optional.of(contract));

        AccessDeniedException exception = assertThrows(AccessDeniedException.class, () -> reviewService.createRenterReview(1L, request, email));
        assertEquals("You are not the owner of this room", exception.getMessage());
    }

    @Test
    void updateReviewStatus_Approved() {
        User admin = new User();
        admin.setId(3L);
        String adminEmail = "admin@example.com";

        Review review = new Review();
        review.setId(1L);
        review.setReviewType(ReviewType.RENTER_TO_ROOM);
        review.setTargetRoom(room);
        review.setStatus(ReviewStatus.PENDING);
        review.setReviewer(user);
        review.setTargetUser(owner);

        when(userRepository.findByEmail(adminEmail)).thenReturn(Optional.of(admin));
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewRepository.findByTargetRoomIdAndStatus(room.getId(), ReviewStatus.APPROVED)).thenReturn(java.util.List.of());

        reviewService.updateReviewStatus(1L, ReviewStatus.APPROVED, adminEmail);

        assertEquals(ReviewStatus.APPROVED, review.getStatus());
        assertEquals(admin, review.getModeratedBy());
        verify(reviewRepository).saveAndFlush(review);
    }
}
