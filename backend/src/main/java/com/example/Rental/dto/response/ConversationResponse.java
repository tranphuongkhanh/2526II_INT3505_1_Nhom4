package com.example.Rental.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConversationResponse {
    private Long id;
    private Long partnerId;
    private String partnerName;
    private String partnerAvatar;
    private String lastMessagePreview;
    private LocalDateTime lastMessageAt;
}