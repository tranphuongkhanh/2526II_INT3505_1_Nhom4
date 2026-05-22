package com.example.Rental.controller;

import java.security.Principal;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rental.dto.request.PostStatusUpdateRequest;
import com.example.Rental.dto.response.AdminPostResponse;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.service.PostService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/posts")
@RequiredArgsConstructor
public class AdminPostController {

    private final PostService postService;

    // 1. Admin lấy danh sách bài đăng (có thể filter theo status)
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminPostResponse>>> getAllPosts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer size) {

        Page<AdminPostResponse> result = postService.getAdminPosts(status, page, size);
        
        ApiResponse<Page<AdminPostResponse>> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Lấy danh sách bài đăng thành công");
        response.setData(result);
        
        return ResponseEntity.ok(response);
    }

    // 2. Admin Duyệt hoặc Từ chối bài đăng
    @PutMapping("/{postId}/status") // Dùng PUT hoặc PATCH đều được
    public ResponseEntity<ApiResponse<AdminPostResponse>> updatePostStatus(
            @PathVariable Long postId,
            @RequestBody PostStatusUpdateRequest request,
            Principal principal) {

        // Lấy email của Admin đang đăng nhập từ Token
        String adminEmail = principal.getName();
        
        AdminPostResponse result = postService.updatePostStatus(postId, request, adminEmail);
        
        ApiResponse<AdminPostResponse> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Cập nhật trạng thái bài đăng thành công");
        response.setData(result);
        
        return ResponseEntity.ok(response);
    }
}