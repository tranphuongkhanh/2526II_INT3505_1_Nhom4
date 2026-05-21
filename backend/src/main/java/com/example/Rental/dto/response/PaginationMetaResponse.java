package com.example.Rental.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaginationMetaResponse {

    @JsonProperty("total")
    private long total;

    @JsonProperty("page")
    private int page;

    @JsonProperty("limit")
    private int limit;
}
