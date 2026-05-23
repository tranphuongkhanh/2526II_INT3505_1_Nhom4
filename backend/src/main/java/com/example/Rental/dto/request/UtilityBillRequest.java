package com.example.Rental.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class UtilityBillRequest {
    private String billingMonth; // ISO date yyyy-MM-dd (first day of month)
    private Integer elecCurr;
    private Integer waterCurr;
    private BigDecimal extraFee;
    private String extraNote;
}

