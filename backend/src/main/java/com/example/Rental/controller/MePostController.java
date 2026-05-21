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

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/me/posts")
@RequiredArgsConstructor
public class MePostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OwnerPostResponse>>> getMyPosts(Principal principal) {
        
        // 1. Lấy email từ token của người đang đăng nhập
        String email = principal.getName();
        
        // 2. Gọi service lấy dữ liệu
        List<OwnerPostResponse> result = postService.getMyPosts(email);
        
        // 3. Trả về response theo chuẩn chung
        ApiResponse<List<OwnerPostResponse>> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Lấy danh sách bài đăng của tôi thành công");
        response.setData(result);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> createPost(
            @RequestBody CreatePostRequest request,
            Principal principal) {
        
        String email = principal.getName();
        Payment payment = postService.createPost(email, request);
        
        ApiResponse<Object> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Tạo yêu cầu đăng bài thành công. Vui lòng thanh toán.");
        response.setData(payment); // Trả về thông tin payment để FE gọi API thanh toán
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{postId}/extend")
    public ResponseEntity<ApiResponse<Object>> extendPost(
            @PathVariable Long postId,
            @RequestBody ExtendPostRequest request,
            Principal principal) {
        
        String email = principal.getName();
        Payment payment = postService.extendPost(email, postId, request);
        
        ApiResponse<Object> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Tạo yêu cầu gia hạn thành công. Vui lòng thanh toán.");
        response.setData(payment);
        
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