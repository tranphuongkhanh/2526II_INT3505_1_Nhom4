package com.example.Rental.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentQueryRequest {

    private String status;

    @Builder.Default
    private Integer page = 1;

    @Builder.Default
    private Integer limit = 20;

    public int normalizedPage() {
        return page == null || page < 1 ? 1 : page;
    }

    public int normalizedLimit() {
        if (limit == null || limit < 1) {
            return 20;
        }
        return Math.min(limit, 100);
    }
}
