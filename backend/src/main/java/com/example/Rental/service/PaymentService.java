package com.example.Rental.service;

import com.example.Rental.dto.request.PaymentQueryRequest;
import com.example.Rental.dto.response.CursorPageResponse;
import com.example.Rental.dto.response.PaginationMetaResponse;
import com.example.Rental.dto.response.PaymentListResponse;
import com.example.Rental.dto.response.PaymentResponse;
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
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final VNPayService vnPayService;

    @Transactional
    public Map<String, String> retryPayment(String email, Long paymentId, String ipAddress) {
        User owner = userRepository.findByEmail(email).orElseThrow(() -> new EntityNotFoundException("User not found"));
        Payment payment = paymentRepository.findById(paymentId).orElseThrow(() -> new EntityNotFoundException("Payment not found"));
        
        if (!payment.getOwner().getId().equals(owner.getId())) {
            throw new AccessDeniedException("Not your payment");
        }
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException("Payment is not pending");
        }
        
        String url = vnPayService.createPaymentUrl(payment, ipAddress);
        Map<String, String> response = new HashMap<>();
        response.put("paymentUrl", url);
        return response;
    }

    @Transactional(readOnly = true)
    public PaymentListResponse listPayments(String email, PaymentQueryRequest query) {
        User owner = userRepository.findByEmail(email).orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (owner.getRole() != UserRole.OWNER) {
            throw new AccessDeniedException("Only owners can view payments");
        }

        int page = (query.getPage() == null || query.getPage() < 1) ? 1 : query.getPage();
        int limit = (query.getLimit() == null || query.getLimit() < 1) ? 20 : query.getLimit();
        limit = Math.min(limit, 100);

        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Payment> payments;
        if (query.getStatus() != null && !query.getStatus().isEmpty()) {
            PaymentStatus status = PaymentStatus.valueOf(query.getStatus().toUpperCase(Locale.ROOT));
            payments = paymentRepository.findByOwnerIdAndStatus(owner.getId(), status, pageable);
        } else {
            payments = paymentRepository.findByOwnerId(owner.getId(), pageable);
        }

        List<PaymentResponse> items = payments.getContent().stream().map(p ->
            PaymentResponse.builder()
                .id(p.getId())
                .ownerId(p.getOwner().getId())
                .postId(p.getPost().getId())
                .extensionId(p.getExtension() != null ? p.getExtension().getId() : null)
                .amount(p.getAmount())
                .status(p.getStatus().name().toLowerCase(Locale.ROOT))
                .note(p.getNote())
                .paidAt(p.getPaidAt())
                .createdAt(p.getCreatedAt())
                .post(PaymentResponse.PostDto.builder()
                        .id(p.getPost().getId())
                        .roomId(p.getPost().getRoom() != null ? p.getPost().getRoom().getId() : null)
                        .status(p.getPost().getStatus().name())
                        .build())
                .build()
        ).collect(Collectors.toList());

        return PaymentListResponse.builder()
            .items(items)
            .meta(PaginationMetaResponse.builder()
                .total(payments.getTotalElements())
                .page(page)
                .limit(limit)
                .build())
            .build();
    }

    // ── Cursor-based pagination ───────────────────────────────────────

    @Transactional(readOnly = true)
    public CursorPageResponse<PaymentResponse> listPaymentsCursor(String email, String statusStr, Long cursor, int limit) {
        User owner = userRepository.findByEmail(email).orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (owner.getRole() != UserRole.OWNER) throw new AccessDeniedException("Only owners can view payments");

        limit = Math.min(Math.max(limit, 1), 100);
        Pageable pageable = PageRequest.of(0, limit + 1);
        List<Payment> payments;

        boolean hasStatusFilter = (statusStr != null && !statusStr.isEmpty());
        if (hasStatusFilter) {
            PaymentStatus status = PaymentStatus.valueOf(statusStr.toUpperCase(Locale.ROOT));
            payments = (cursor == null)
                ? paymentRepository.findByOwnerIdAndStatusOrderByIdDesc(owner.getId(), status, pageable)
                : paymentRepository.findByOwnerIdAndStatusAndIdLessThanOrderByIdDesc(owner.getId(), status, cursor, pageable);
        } else {
            payments = (cursor == null)
                ? paymentRepository.findByOwnerIdOrderByIdDesc(owner.getId(), pageable)
                : paymentRepository.findByOwnerIdAndIdLessThanOrderByIdDesc(owner.getId(), cursor, pageable);
        }

        Long nextCursor = null;
        if (payments.size() > limit) {
            nextCursor = payments.get(limit - 1).getId();
            payments = payments.subList(0, limit);
        }

        List<PaymentResponse> items = payments.stream().map(p ->
            PaymentResponse.builder()
                .id(p.getId())
                .ownerId(p.getOwner().getId())
                .postId(p.getPost().getId())
                .extensionId(p.getExtension() != null ? p.getExtension().getId() : null)
                .amount(p.getAmount())
                .status(p.getStatus().name().toLowerCase(Locale.ROOT))
                .note(p.getNote())
                .paidAt(p.getPaidAt())
                .createdAt(p.getCreatedAt())
                .post(PaymentResponse.PostDto.builder()
                        .id(p.getPost().getId())
                        .roomId(p.getPost().getRoom() != null ? p.getPost().getRoom().getId() : null)
                        .status(p.getPost().getStatus().name())
                        .build())
                .build()
        ).collect(Collectors.toList());

        return new CursorPageResponse<>(items, nextCursor);
    }
}
