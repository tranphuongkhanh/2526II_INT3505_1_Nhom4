package com.example.Rental.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractQueryRequest {
    private Integer page = 1;
    private Integer limit = 20;
}
