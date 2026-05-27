package com.example.Rental.controller;

import java.security.Principal;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rental.dto.request.PostSearchRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.PostDetailResponse;
import com.example.Rental.dto.response.PostSummaryResponse;
import com.example.Rental.service.PostService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PostSummaryResponse>>> searchPosts(
            @ModelAttribute PostSearchRequest request) {
        
        Page<PostSummaryResponse> result = postService.searchPosts(request);
        
        ApiResponse<Page<PostSummaryResponse>> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Lấy danh sách bài đăng thành công");
        response.setData(result);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostDetailResponse>> getPostDetail(
            @PathVariable Long postId,
            Principal principal) {

        String viewerEmail = principal != null ? principal.getName() : null;
        PostDetailResponse result = postService.getPostDetail(postId, viewerEmail);
        postService.recordPostView(postId);

        ApiResponse<PostDetailResponse> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Chi tiết bài đăng");
        response.setData(result);

        return ResponseEntity.ok(response);
    }
}