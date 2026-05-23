package com.example.Rental.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateContractRequest {
    @JsonProperty("renter_id")
    @NotNull
    @Positive
    private Long renterId;
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
}
