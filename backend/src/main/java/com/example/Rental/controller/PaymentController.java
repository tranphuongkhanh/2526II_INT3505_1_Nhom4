package com.example.Rental.controller;

import com.example.Rental.dto.request.PaymentQueryRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.PaymentListResponse;
import com.example.Rental.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/me/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaymentListResponse>> getMyPayments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer limit,
            Principal principal
    ) {
        String email = principal.getName();

        PaymentQueryRequest query = PaymentQueryRequest.builder()
                .status(status)
                .page(page)
                .limit(limit)
                .build();

        PaymentListResponse resp = paymentService.listPayments(email, query);
        return ResponseEntity.ok(ApiResponse.ok("Payments retrieved successfully", resp));
    }

    @PostMapping("/{paymentId}/retry")
    public ResponseEntity<ApiResponse<Map<String, String>>> retryPayment(
            @PathVariable Long paymentId,
            HttpServletRequest request,
            Principal principal) {
        String email = principal.getName();
        String ipAddress = request.getRemoteAddr();
        Map<String, String> result = paymentService.retryPayment(email, paymentId, ipAddress);
        return ResponseEntity.ok(ApiResponse.ok("Payment URL generated", result));
    }
}
