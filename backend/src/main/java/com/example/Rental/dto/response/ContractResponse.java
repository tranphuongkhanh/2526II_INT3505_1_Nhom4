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

    @JsonProperty("renter_name")
    private String renterName;

    @JsonProperty("renter_phone")
    private String renterPhone;

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

    @JsonProperty("room_title")
    private String roomTitle;

    @JsonProperty("room_address")
    private String roomAddress;

    @JsonProperty("room_ward")
    private String roomWard;

    @JsonProperty("room_district")
    private String roomDistrict;

    @JsonProperty("room_city")
    private String roomCity;

    @JsonProperty("owner_name")
    private String ownerName;

    @JsonProperty("owner_phone")
    private String ownerPhone;
}
