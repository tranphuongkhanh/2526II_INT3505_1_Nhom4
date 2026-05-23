package com.example.Rental.dto.request;

import com.example.Rental.enums.DurationType;

import lombok.Data;

@Data
public class CreatePostRequest {
    private Long roomId;
    private DurationType durationType; // DAY, WEEK, MONTH
    private Integer durationValue;     // Số lượng (VD: 3 ngày, 2 tháng)
}