package com.example.Rental.controller;

import com.example.Rental.dto.request.UtilityBillRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.entity.UtilityBill;
import com.example.Rental.service.UtilityBillService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.LocalDate;
import com.example.Rental.dto.response.UtilityBillResponse;

@RestController
@RequestMapping("/api/v1")
public class UtilityBillController {

    private final UtilityBillService utilityBillService;

    public UtilityBillController(UtilityBillService utilityBillService) {
        this.utilityBillService = utilityBillService;
    }

    @GetMapping("/contracts/{contractId}/bills")
    public ResponseEntity<ApiResponse<List<UtilityBillResponse>>> listByContract(@PathVariable Long contractId) {
        List<UtilityBill> bills = utilityBillService.listByContract(contractId);
        List<UtilityBillResponse> resp = bills.stream().map(b -> UtilityBillResponse.builder()
                .id(b.getId())
                .contractId(b.getContract().getId())
                .roomId(b.getRoom().getId())
                .billingMonth(b.getBillingMonth())
                .elecPrev(b.getElecPrev())
                .elecCurr(b.getElecCurr())
                .elecUsage(b.getElecUsage())
                .elecUnitPrice(b.getElecUnitPrice())
                .elecAmount(b.getElecAmount())
                .waterPrev(b.getWaterPrev())
                .waterCurr(b.getWaterCurr())
                .waterUsage(b.getWaterUsage())
                .waterUnitPrice(b.getWaterUnitPrice())
                .waterAmount(b.getWaterAmount())
                .rentAmount(b.getRentAmount())
                .serviceFee(b.getServiceFee())
                .wifiFee(b.getWifiFee())
                .bikeParkingFee(b.getBikeParkingFee())
                .extraFee(b.getExtraFee())
                .extraNote(b.getExtraNote())
                .totalAmount(b.getTotalAmount())
                .status(b.getStatus().name())
                .paidAt(b.getPaidAt())
                .createdAt(b.getCreatedAt())
                .build())
            .toList();

        return ResponseEntity.ok(ApiResponse.ok("Bills retrieved", resp));
    }

    @PostMapping("/contracts/{contractId}/bills")
    public ResponseEntity<ApiResponse<UtilityBillResponse>> createMonthly(@PathVariable Long contractId,
                                                                 @RequestBody(required = false) UtilityBillRequest req) {
        UtilityBill bill;
        if (req == null || req.getElecCurr() == null) {
            bill = utilityBillService.createMonthlyBill(contractId);
        } else {
            LocalDate billingMonth = LocalDate.parse(req.getBillingMonth());
            bill = utilityBillService.createMonthlyBillWithMeters(contractId, billingMonth, req.getElecCurr(), req.getWaterCurr(), req.getExtraFee(), req.getExtraNote());
        }

        UtilityBillResponse r = UtilityBillResponse.builder()
                .id(bill.getId())
                .contractId(bill.getContract().getId())
                .roomId(bill.getRoom().getId())
                .billingMonth(bill.getBillingMonth())
                .elecPrev(bill.getElecPrev())
                .elecCurr(bill.getElecCurr())
                .elecUsage(bill.getElecUsage())
                .elecUnitPrice(bill.getElecUnitPrice())
                .elecAmount(bill.getElecAmount())
                .waterPrev(bill.getWaterPrev())
                .waterCurr(bill.getWaterCurr())
                .waterUsage(bill.getWaterUsage())
                .waterUnitPrice(bill.getWaterUnitPrice())
                .waterAmount(bill.getWaterAmount())
                .rentAmount(bill.getRentAmount())
                .serviceFee(bill.getServiceFee())
                .wifiFee(bill.getWifiFee())
                .bikeParkingFee(bill.getBikeParkingFee())
                .extraFee(bill.getExtraFee())
                .extraNote(bill.getExtraNote())
                .totalAmount(bill.getTotalAmount())
                .status(bill.getStatus().name())
                .paidAt(bill.getPaidAt())
                .createdAt(bill.getCreatedAt())
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Bill created", r));
    }

    @GetMapping("/bills/{billId}")
    public ResponseEntity<ApiResponse<UtilityBillResponse>> getBill(@PathVariable Long billId) {
        UtilityBill bill = utilityBillService.getById(billId);
        UtilityBillResponse r = UtilityBillResponse.builder()
                .id(bill.getId())
                .contractId(bill.getContract().getId())
                .roomId(bill.getRoom().getId())
                .billingMonth(bill.getBillingMonth())
                .elecPrev(bill.getElecPrev())
                .elecCurr(bill.getElecCurr())
                .elecUsage(bill.getElecUsage())
                .elecUnitPrice(bill.getElecUnitPrice())
                .elecAmount(bill.getElecAmount())
                .waterPrev(bill.getWaterPrev())
                .waterCurr(bill.getWaterCurr())
                .waterUsage(bill.getWaterUsage())
                .waterUnitPrice(bill.getWaterUnitPrice())
                .waterAmount(bill.getWaterAmount())
                .rentAmount(bill.getRentAmount())
                .serviceFee(bill.getServiceFee())
                .wifiFee(bill.getWifiFee())
                .bikeParkingFee(bill.getBikeParkingFee())
                .extraFee(bill.getExtraFee())
                .extraNote(bill.getExtraNote())
                .totalAmount(bill.getTotalAmount())
                .status(bill.getStatus().name())
                .paidAt(bill.getPaidAt())
                .createdAt(bill.getCreatedAt())
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Bill retrieved", r));
    }

    @PatchMapping("/bills/{billId}/paid")
    public ResponseEntity<ApiResponse<UtilityBillResponse>> markPaid(@PathVariable Long billId) {
        UtilityBill bill = utilityBillService.markPaid(billId);
        UtilityBillResponse r = UtilityBillResponse.builder()
                .id(bill.getId())
                .contractId(bill.getContract().getId())
                .roomId(bill.getRoom().getId())
                .billingMonth(bill.getBillingMonth())
                .elecPrev(bill.getElecPrev())
                .elecCurr(bill.getElecCurr())
                .elecUsage(bill.getElecUsage())
                .elecUnitPrice(bill.getElecUnitPrice())
                .elecAmount(bill.getElecAmount())
                .waterPrev(bill.getWaterPrev())
                .waterCurr(bill.getWaterCurr())
                .waterUsage(bill.getWaterUsage())
                .waterUnitPrice(bill.getWaterUnitPrice())
                .waterAmount(bill.getWaterAmount())
                .rentAmount(bill.getRentAmount())
                .serviceFee(bill.getServiceFee())
                .wifiFee(bill.getWifiFee())
                .bikeParkingFee(bill.getBikeParkingFee())
                .extraFee(bill.getExtraFee())
                .extraNote(bill.getExtraNote())
                .totalAmount(bill.getTotalAmount())
                .status(bill.getStatus().name())
                .paidAt(bill.getPaidAt())
                .createdAt(bill.getCreatedAt())
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Bill marked paid", r));
    }
}
