package com.example.Rental.controller;

import com.example.Rental.dto.request.PaymentQueryRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.PaymentListResponse;
import com.example.Rental.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/me/payments")
    public ResponseEntity<ApiResponse<PaymentListResponse>> getMyPayments(
        Principal principal,
        @ModelAttribute PaymentQueryRequest request
    ) {
        PaymentListResponse data = paymentService.getMyPayments(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok("Payments retrieved successfully", data));
    }
}
