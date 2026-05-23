package com.example.Rental.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MessageResponse {
    private Long id;
    private Long senderId;
    private String content;
    private Boolean isRead;
    private LocalDateTime createdAt;
}