package com.example.Rental.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentListResponse {
    private List<PaymentResponse> items;
    private PaginationMetaResponse meta;
}

