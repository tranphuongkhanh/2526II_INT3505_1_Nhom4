package com.example.Rental.dto.request;

import com.example.Rental.enums.DurationType;

import lombok.Data;

@Data
public class ExtendPostRequest {
    private DurationType durationType;
    private Integer durationValue;
}