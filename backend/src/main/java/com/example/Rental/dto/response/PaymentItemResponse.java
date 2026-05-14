package com.example.Rental.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class PaymentItemResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("owner_id")
    private Long ownerId;

    @JsonProperty("post_id")
    private Long postId;

    @JsonProperty("extension_id")
    private Long extensionId;

    @JsonProperty("amount")
    private BigDecimal amount;

    @JsonProperty("status")
    private String status;

    @JsonProperty("note")
    private String note;

    @JsonProperty("paid_at")
    private LocalDateTime paidAt;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("post")
    private PaymentPostSummaryResponse post;
}
