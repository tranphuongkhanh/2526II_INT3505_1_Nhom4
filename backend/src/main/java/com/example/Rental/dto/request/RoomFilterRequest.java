package com.example.Rental.dto.request;

import com.example.Rental.enums.RentalStatus;
import com.example.Rental.enums.RoomType;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class RoomFilterRequest {
    private RentalStatus status;  // Trạng thái

    private RoomType roomType;    // Loại phòng

    private BigDecimal minPrice;  // Giá tối thiểu
    private BigDecimal maxPrice;  // Giá tối đa

    private Double minArea;       // Diện tích tối thiểu

    private String ward;          // Địa chỉ
    private String district;
    private String city;

    private Boolean hasWifi;      // Tiện ích (Ví dụ)
    private Boolean hasAc;
    private Boolean hasFridge;
    private Boolean hasParking;
    private Boolean hasPrivateWc;
    private Boolean hasSecurity;

    private Double minAvgRating;  // Rating tối thiểu
}
