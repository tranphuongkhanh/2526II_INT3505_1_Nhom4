package com.example.Rental.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.example.Rental.enums.RoomType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostDetailResponse {
    private Long id;
    private Integer viewCount;
    private Integer favoriteCount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    // Thông tin Room
    private Long roomId;
    private String title;
    private String description;
    private BigDecimal price;
    private Double areaMq;
    private RoomType roomType;
    private String address;
    private String ward;
    private String district;
    private String city;
    
    // Tiện ích
    private Boolean hasWifi;
    private Boolean hasAc;
    private Boolean hasFridge;
    private Boolean hasParking;
    private Boolean hasPrivateWc;
    private Boolean hasSecurity;

    // Ảnh
    private List<String> imageUrls;
}