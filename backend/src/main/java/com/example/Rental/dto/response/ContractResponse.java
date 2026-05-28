package com.example.Rental.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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

    @JsonProperty("room_thumbnail_url")
    private String roomThumbnailUrl;

    @JsonProperty("room_image_urls")
    private List<String> roomImageUrls;

    @JsonProperty("room_area_mq")
    private Double roomAreaMq;

    @JsonProperty("room_type")
    private String roomType;

    @JsonProperty("room_deposit")
    private BigDecimal roomDeposit;

    @JsonProperty("room_service_fee")
    private BigDecimal roomServiceFee;

    @JsonProperty("room_wifi_fee")
    private BigDecimal roomWifiFee;

    @JsonProperty("room_bike_parking_fee")
    private BigDecimal roomBikeParkingFee;

    @JsonProperty("room_has_ac")
    private Boolean roomHasAc;

    @JsonProperty("room_has_fridge")
    private Boolean roomHasFridge;

    @JsonProperty("room_has_private_wc")
    private Boolean roomHasPrivateWc;

    @JsonProperty("room_has_security")
    private Boolean roomHasSecurity;

    @JsonProperty("room_avg_rating")
    private Double roomAvgRating;

    @JsonProperty("room_review_count")
    private Integer roomReviewCount;

    @JsonProperty("post_id")
    private Long postId;
}
