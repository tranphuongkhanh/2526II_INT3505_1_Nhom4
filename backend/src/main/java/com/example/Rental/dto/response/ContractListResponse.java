package com.example.Rental.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractListResponse {

    @JsonProperty("items")
    private List<ContractResponse> items;

    @JsonProperty("meta")
    private PaginationMetaResponse meta;
}
