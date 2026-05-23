package com.example.Rental.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewListResponse {
    @JsonProperty("items")
    private List<ReviewResponse> items;

    @JsonProperty("meta")
    private PaginationMetaResponse meta;
}
