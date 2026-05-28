package com.example.Rental.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class UtilityBillResponse {
    private Long id;
    private Long contractId;
    private Long roomId;
    private LocalDate billingMonth;
    private Integer elecPrev;
    private Integer elecCurr;
    private Integer elecUsage;
    private BigDecimal elecUnitPrice;
    private BigDecimal elecAmount;
    private Integer waterPrev;
    private Integer waterCurr;
    private Integer waterUsage;
    private BigDecimal waterUnitPrice;
    private BigDecimal waterAmount;
    private BigDecimal rentAmount;
    private BigDecimal serviceFee;
    private BigDecimal wifiFee;
    private BigDecimal bikeParkingFee;
    private BigDecimal extraFee;
    private String extraNote;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime paidAt;
    private String paymentProofUrl;
    private LocalDateTime proofSubmittedAt;
    private String rejectionReason;
    private String ownerBankCode;
    private String ownerBankAccountNumber;
    private String ownerBankAccountName;
    private LocalDateTime createdAt;
}

