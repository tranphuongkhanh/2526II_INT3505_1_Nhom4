package com.example.Rental.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.example.Rental.enums.RoomType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
    private Boolean hasAc;
    private Boolean hasFridge;
    private Boolean hasPrivateWc;
    private Boolean hasSecurity;

    // Chi phí dịch vụ
    private BigDecimal wifiFee;
    private BigDecimal waterPricePerUnit;
    private BigDecimal electricityPricePerUnit;
    private BigDecimal serviceFee;
    private BigDecimal bikeParkingFee;
    private BigDecimal deposit;

    // Ảnh
    private List<String> imageUrls;

    // Chủ nhà
    private Long ownerId;
    private String ownerName;
    private String ownerPhone;
    private String ownerAvatar;

    // Trạng thái yêu thích (null nếu chưa đăng nhập)
    private Boolean isFavorited;
}