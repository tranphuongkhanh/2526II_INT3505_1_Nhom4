package com.example.Rental.dto.request;

import lombok.Data;

@Data
public class CreateConversationRequest {
    private Long partnerId; // ID của người mà bạn muốn chat cùng
}