package com.example.Rental.dto.request;

import com.example.Rental.enums.PostStatus;

import lombok.Data;

@Data
public class PostStatusUpdateRequest {
    private PostStatus status; // APPROVED hoặc REJECTED
    private String rejectReason; // Bắt buộc nếu là REJECTED
}