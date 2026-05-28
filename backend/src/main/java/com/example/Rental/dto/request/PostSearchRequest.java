package com.example.Rental.dto.request;

import java.math.BigDecimal;
import java.util.List;

import com.example.Rental.enums.RoomType;

import lombok.Data;

@Data
public class PostSearchRequest {
    private String keyword; // Tìm theo title hoặc address của phòng
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private List<RoomType> roomTypes;
    private String city;
    private String district;
    private BigDecimal maxElectricityPrice;
    private BigDecimal maxWaterPrice;
    private BigDecimal maxServiceFee;
    private BigDecimal maxWifiFee;

    private Boolean hasAc;
    private Boolean hasFridge;
    private Boolean hasPrivateWc;
    private Boolean hasSecurity;

    private Integer page = 0;
    private Integer size = 10;
}