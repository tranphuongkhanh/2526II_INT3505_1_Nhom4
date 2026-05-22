package com.example.Rental.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rental.dto.request.CreateConversationRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.ConversationResponse;
import com.example.Rental.service.ConversationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    // 1. Danh sách hội thoại
    @GetMapping
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getMyConversations(Principal principal) {
        String email = principal.getName();
        List<ConversationResponse> result = conversationService.getUserConversations(email);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách hội thoại thành công", result));
    }

    // 2. Tạo hoặc lấy lại hội thoại
    @PostMapping
    public ResponseEntity<ApiResponse<ConversationResponse>> getOrCreateConversation(
            @RequestBody CreateConversationRequest request,
            Principal principal) {
        
        String email = principal.getName();
        ConversationResponse result = conversationService.getOrCreateConversation(email, request);
        return ResponseEntity.ok(ApiResponse.ok("Lấy/Tạo hội thoại thành công", result));
    }

    // 3. Chi tiết hội thoại
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversationDetail(
            @PathVariable Long id,
            Principal principal) {
        
        String email = principal.getName();
        ConversationResponse result = conversationService.getConversationDetail(email, id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin hội thoại thành công", result));
    }
}