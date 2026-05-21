package com.example.Rental.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long id;
    private Long ownerId;
    private Long postId;
    private Long extensionId;
    private BigDecimal amount;
    private String status;
    private String note;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private PostDto post;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PostDto {
        private Long id;
        private Long roomId;
    }
}

