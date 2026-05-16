package com.example.Rental.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("room_id")
    private Long roomId;

    @JsonProperty("renter_id")
    private Long renterId;

    @JsonProperty("status")
    private String status;

    @JsonProperty("start_date")
    private LocalDate startDate;

    @JsonProperty("end_date")
    private LocalDate endDate;

    @JsonProperty("monthly_rent")
    private BigDecimal monthlyRent;

    @JsonProperty("electricity_price")
    private BigDecimal electricityPrice;

    @JsonProperty("water_price")
    private BigDecimal waterPrice;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
