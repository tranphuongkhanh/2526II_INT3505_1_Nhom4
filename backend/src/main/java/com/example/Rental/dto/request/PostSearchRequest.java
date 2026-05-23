package com.example.Rental.dto.request;

import java.math.BigDecimal;

import com.example.Rental.enums.RoomType;

import lombok.Data;

@Data
public class PostSearchRequest {
    private String keyword; // Tìm theo title hoặc address của phòng
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private RoomType roomType;
    private String city;
    private String district;
    private Integer page = 0;
    private Integer size = 10;
}