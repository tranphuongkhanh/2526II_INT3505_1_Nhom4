package com.example.Rental.dto.response;

import com.example.Rental.enums.RentalStatus;
import com.example.Rental.enums.RoomType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private Long id;
    private Long ownerId;
    private String title;
    private String description;
    private BigDecimal price;
    private Double areaMq;
    private RoomType roomType;
    private String address;
    private String ward;
    private String district;
    private String city;
    private Boolean hasAc;
    private Boolean hasFridge;
    private Boolean hasPrivateWc;
    private Boolean hasSecurity;
    private BigDecimal wifiFee;
    private BigDecimal waterPricePerUnit;
    private BigDecimal electricityPricePerUnit;
    private BigDecimal serviceFee;
    private BigDecimal bikeParkingFee;
    private BigDecimal deposit;
    private RentalStatus rentalStatus;
    private Double avgRating;
    private Integer reviewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<RoomImageResponse> images;
}
