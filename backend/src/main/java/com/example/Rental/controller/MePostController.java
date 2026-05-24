package com.example.Rental.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rental.dto.request.CreatePostRequest;
import com.example.Rental.dto.request.ExtendPostRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.OwnerPostResponse;
import com.example.Rental.entity.Payment;
import com.example.Rental.service.PostService;
import com.example.Rental.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/me/posts")
@RequiredArgsConstructor
public class MePostController {

    private final PostService postService;
    private final VNPayService vnPayService;

    @GetMapping
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<OwnerPostResponse>>> getMyPosts(
            @org.springframework.web.bind.annotation.RequestParam(required = false, defaultValue = "1") Integer page,
            @org.springframework.web.bind.annotation.RequestParam(required = false, defaultValue = "10") Integer size,
            Principal principal) {
        
        // 1. Lấy email từ token của người đang đăng nhập
        String email = principal.getName();
        
        // 2. Gọi service lấy dữ liệu
        org.springframework.data.domain.Page<OwnerPostResponse> result = postService.getMyPosts(email, page, size);
        
        // 3. Trả về response theo chuẩn chung
        ApiResponse<org.springframework.data.domain.Page<OwnerPostResponse>> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Lấy danh sách bài đăng của tôi thành công");
        response.setData(result);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> createPost(
            @RequestBody CreatePostRequest request,
            Principal principal,
            HttpServletRequest httpRequest) {
        
        String email = principal.getName();
        Payment payment = postService.createPost(email, request);
        
        String ipAddress = httpRequest.getHeader("X-FORWARDED-FOR");
        if (ipAddress == null) {
            ipAddress = httpRequest.getRemoteAddr();
        }
        String paymentUrl = vnPayService.createPaymentUrl(payment, ipAddress);

        java.util.Map<String, Object> paymentData = new java.util.HashMap<>();
        paymentData.put("id", payment.getId());
        paymentData.put("amount", payment.getAmount());
        paymentData.put("status", payment.getStatus());
        paymentData.put("paymentUrl", paymentUrl);
        
        ApiResponse<Object> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Tạo yêu cầu đăng bài thành công. Vui lòng thanh toán.");
        response.setData(paymentData); // Trả về thông tin payment để FE gọi API thanh toán
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{postId}/extend")
    public ResponseEntity<ApiResponse<Object>> extendPost(
            @PathVariable Long postId,
            @RequestBody ExtendPostRequest request,
            Principal principal,
            HttpServletRequest httpRequest) {
        
        String email = principal.getName();
        Payment payment = postService.extendPost(email, postId, request);
        
        String ipAddress = httpRequest.getHeader("X-FORWARDED-FOR");
        if (ipAddress == null) {
            ipAddress = httpRequest.getRemoteAddr();
        }
        String paymentUrl = vnPayService.createPaymentUrl(payment, ipAddress);

        java.util.Map<String, Object> paymentData = new java.util.HashMap<>();
        paymentData.put("id", payment.getId());
        paymentData.put("amount", payment.getAmount());
        paymentData.put("status", payment.getStatus());
        paymentData.put("paymentUrl", paymentUrl);
        
        ApiResponse<Object> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Tạo yêu cầu gia hạn thành công. Vui lòng thanh toán.");
        response.setData(paymentData);
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Object>> deletePost(
            @PathVariable Long postId,
            Principal principal) {
            
        String email = principal.getName();
        
        // Gọi service xử lý
        postService.deletePost(email, postId);
        
        ApiResponse<Object> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Xóa (ẩn) bài đăng thành công");
        response.setData(null); // Không cần trả về data khi xóa thành công
        
        return ResponseEntity.ok(response);
    }
}