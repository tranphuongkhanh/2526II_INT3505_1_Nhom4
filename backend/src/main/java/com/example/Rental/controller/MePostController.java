package com.example.Rental.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.OwnerPostResponse;
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
}