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

    @GetMapping("/vnpay-return")
    public ResponseEntity<ApiResponse<Object>> vnpayReturn(@RequestParam Map<String, String> params) {
        ApiResponse<Object> response = new ApiResponse<>();
        
        try {
            boolean isVerified = vnPayService.verifyPayment(params);
            if (!isVerified) {
                response.setSuccess(false);
                response.setMessage("Chữ ký không hợp lệ!");
                return ResponseEntity.badRequest().body(response);
            }

            String vnp_ResponseCode = params.get("vnp_ResponseCode");
            String vnp_TxnRef = params.get("vnp_TxnRef"); // format: paymentId_random
            
            if (!"00".equals(vnp_ResponseCode)) {
                response.setSuccess(false);
                response.setMessage("Thanh toán thất bại hoặc bị hủy!");
                return ResponseEntity.ok(response);
            }

            Long paymentId = Long.parseLong(vnp_TxnRef.split("_")[0]);
            Payment payment = paymentRepository.findById(paymentId).orElse(null);

            if (payment == null) {
                response.setSuccess(false);
                response.setMessage("Không tìm thấy đơn thanh toán!");
                return ResponseEntity.badRequest().body(response);
            }

            if (payment.getStatus() == PaymentStatus.PAID) {
                response.setSuccess(true);
                response.setMessage("Đơn này đã được thanh toán trước đó!");
                return ResponseEntity.ok(response);
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

            response.setSuccess(true);
            response.setMessage("Thanh toán thành công!");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.setSuccess(false);
            response.setMessage("Lỗi xử lý thanh toán: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
