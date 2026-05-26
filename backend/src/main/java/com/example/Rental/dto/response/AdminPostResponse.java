package com.example.Rental.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.example.Rental.enums.PostStatus;
import com.example.Rental.enums.RoomType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminPostResponse {
    private Long id;
    private String roomTitle;
    private String ownerName;
    private String ownerEmail;
    private PostStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String rejectReason;
    private String approvedByEmail;
    private LocalDateTime approvedAt;

    // Room details
    private BigDecimal price;
    private BigDecimal deposit;
    private Double areaMq;
    private RoomType roomType;
    private String description;
    private String address;
    private String ward;
    private String district;
    private String city;
    private Boolean hasAc;
    private Boolean hasFridge;
    private Boolean hasPrivateWc;
    private Boolean hasSecurity;
    private BigDecimal wifiFee;
    private BigDecimal electricityPricePerUnit;
    private BigDecimal waterPricePerUnit;
    private BigDecimal serviceFee;
    private BigDecimal bikeParkingFee;
    private List<RoomImageResponse> images;
}
