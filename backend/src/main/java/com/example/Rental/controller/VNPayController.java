package com.example.Rental.controller;

import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.entity.Payment;
import com.example.Rental.entity.Post;
import com.example.Rental.entity.PostExtension;
import com.example.Rental.enums.PaymentStatus;
import com.example.Rental.enums.PostStatus;
import com.example.Rental.repository.PaymentRepository;
import com.example.Rental.repository.PostRepository;
import com.example.Rental.service.VNPayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class VNPayController {

    private final VNPayService vnPayService;
    private final PaymentRepository paymentRepository;
    private final PostRepository postRepository;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @GetMapping("/vnpay-return")
    public ResponseEntity<Void> vnpayReturn(@RequestParam Map<String, String> params) {
        String redirectUrl = frontendUrl + "/owner/payments";
        
        try {
            boolean isVerified = vnPayService.verifyPayment(params);
            if (!isVerified) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                        .location(java.net.URI.create(redirectUrl + "?paymentStatus=invalid_signature"))
                        .build();
            }

            String vnp_ResponseCode = params.get("vnp_ResponseCode");
            String vnp_TxnRef = params.get("vnp_TxnRef"); // format: paymentId_random
            
            if (!"00".equals(vnp_ResponseCode)) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                        .location(java.net.URI.create(redirectUrl + "?paymentStatus=failed"))
                        .build();
            }

            Long paymentId = Long.parseLong(vnp_TxnRef.split("_")[0]);
            Payment payment = paymentRepository.findById(paymentId).orElse(null);

            if (payment == null) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                        .location(java.net.URI.create(redirectUrl + "?paymentStatus=not_found"))
                        .build();
            }

            if (payment.getStatus() == PaymentStatus.PAID) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                        .location(java.net.URI.create(redirectUrl + "?paymentStatus=already_paid"))
                        .build();
            }

            // Mark as PAID
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaidAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Handle Post logic
            Post post = payment.getPost();
            if (payment.getExtension() != null) {
                // This is an extension payment
                PostExtension extension = payment.getExtension();
                post.setEndDate(extension.getNewEndDate());
                postRepository.save(post);
            } else {
                // This is a creation payment
                // If it is already APPROVED by Admin, then activate it now
                if (post.getStatus() == PostStatus.APPROVED) {
                    post.setStartDate(LocalDateTime.now());
                    
                    LocalDateTime endDate = LocalDateTime.now();
                    switch (post.getDurationType()) {
                        case DAY:
                            endDate = endDate.plusDays(post.getDurationValue());
                            break;
                        case WEEK:
                            endDate = endDate.plusWeeks(post.getDurationValue());
                            break;
                        case MONTH:
                            endDate = endDate.plusMonths(post.getDurationValue());
                            break;
                        case QUARTER:
                            endDate = endDate.plusMonths(post.getDurationValue() * 3L);
                            break;
                        case YEAR:
                            endDate = endDate.plusYears(post.getDurationValue());
                            break;
                    }
                    post.setEndDate(endDate);
                    postRepository.save(post);
                }
            }

            return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                    .location(java.net.URI.create(redirectUrl + "?paymentStatus=success"))
                    .build();

        } catch (Exception e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                    .location(java.net.URI.create(redirectUrl + "?paymentStatus=error"))
                    .build();
        }
    }
}
