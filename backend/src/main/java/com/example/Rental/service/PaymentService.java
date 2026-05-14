package com.example.Rental.service;

import com.example.Rental.dto.request.PaymentQueryRequest;
import com.example.Rental.dto.response.PaginationMetaResponse;
import com.example.Rental.dto.response.PaymentItemResponse;
import com.example.Rental.dto.response.PaymentListResponse;
import com.example.Rental.dto.response.PaymentPostSummaryResponse;
import com.example.Rental.entity.Payment;
import com.example.Rental.entity.User;
import com.example.Rental.enums.PaymentStatus;
import com.example.Rental.enums.UserRole;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.PaymentRepository;
import com.example.Rental.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    public PaymentListResponse getMyPayments(String email, PaymentQueryRequest request) {
        User currentUser = userRepository.findByEmail(email)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (currentUser.getRole() != UserRole.OWNER) {
            throw new AccessDeniedException("Only owners can view payment history");
        }

        int page = request.normalizedPage();
        int limit = request.normalizedLimit();
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));

        PaymentStatus paymentStatus = parseStatus(request.getStatus());
        Page<Payment> paymentPage = paymentStatus == null
            ? paymentRepository.findByOwnerId(currentUser.getId(), pageable)
            : paymentRepository.findByOwnerIdAndStatus(currentUser.getId(), paymentStatus, pageable);

        List<PaymentItemResponse> items = paymentPage.getContent().stream()
            .map(this::toResponseItem)
            .toList();

        return PaymentListResponse.builder()
            .items(items)
            .meta(PaginationMetaResponse.builder()
                .total(paymentPage.getTotalElements())
                .page(page)
                .limit(limit)
                .build())
            .build();
    }

    private PaymentItemResponse toResponseItem(Payment payment) {
        Long postId = payment.getPost() != null ? payment.getPost().getId() : null;
        Long roomId = payment.getPost() != null && payment.getPost().getRoom() != null
            ? payment.getPost().getRoom().getId()
            : null;

        return PaymentItemResponse.builder()
            .id(payment.getId())
            .ownerId(payment.getOwner() != null ? payment.getOwner().getId() : null)
            .postId(postId)
            .extensionId(payment.getExtension() != null ? payment.getExtension().getId() : null)
            .amount(payment.getAmount())
            .status(payment.getStatus() != null ? payment.getStatus().name().toLowerCase(Locale.ROOT) : null)
            .note(payment.getNote())
            .paidAt(payment.getPaidAt())
            .createdAt(payment.getCreatedAt())
            .post(PaymentPostSummaryResponse.builder()
                .id(postId)
                .roomId(roomId)
                .build())
            .build();
    }

    private PaymentStatus parseStatus(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            return null;
        }

        try {
            return PaymentStatus.valueOf(rawStatus.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid status. Supported values: pending, paid");
        }
    }
}
