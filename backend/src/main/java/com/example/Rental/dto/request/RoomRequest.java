package com.example.Rental.dto.request;

import com.example.Rental.enums.RoomType;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class RoomRequest {
    private String title;
    private String description;
    private BigDecimal price;
    private Double areaMq;
    private RoomType roomType;
    private String address;
    private String ward;
    private String district;
    private String city;
    private Boolean hasWifi = false;
    private Boolean hasAc = false;
    private Boolean hasFridge = false;
    private Boolean hasParking = false;
    private Boolean hasPrivateWc = false;
    private Boolean hasSecurity = false;
}