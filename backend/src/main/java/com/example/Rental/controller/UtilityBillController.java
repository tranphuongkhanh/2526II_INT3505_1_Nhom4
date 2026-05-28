package com.example.Rental.controller;

import com.example.Rental.dto.request.UtilityBillRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.UtilityBillResponse;
import com.example.Rental.entity.UtilityBill;
import com.example.Rental.service.UtilityBillService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class UtilityBillController {

    private final UtilityBillService utilityBillService;

    public UtilityBillController(UtilityBillService utilityBillService) {
        this.utilityBillService = utilityBillService;
    }

    private UtilityBillResponse toResponse(UtilityBill b) {
        com.example.Rental.entity.User owner = (b.getRoom() != null) ? b.getRoom().getOwner() : null;
        return UtilityBillResponse.builder()
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
                .paymentProofUrl(b.getPaymentProofUrl())
                .proofSubmittedAt(b.getProofSubmittedAt())
                .rejectionReason(b.getRejectionReason())
                .ownerBankCode(owner != null ? owner.getBankCode() : null)
                .ownerBankAccountNumber(owner != null ? owner.getBankAccountNumber() : null)
                .ownerBankAccountName(owner != null ? owner.getBankAccountName() : null)
                .createdAt(b.getCreatedAt())
                .build();
    }

    @GetMapping("/contracts/{contractId}/bills")
    public ResponseEntity<ApiResponse<List<UtilityBillResponse>>> listByContract(@PathVariable Long contractId) {
        List<UtilityBillResponse> resp = utilityBillService.listByContract(contractId).stream()
                .map(this::toResponse).toList();
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
            bill = utilityBillService.createMonthlyBillWithMeters(contractId, billingMonth, req.getElecCurr(),
                    req.getWaterCurr(), req.getExtraFee(), req.getExtraNote());
        }
        return ResponseEntity.ok(ApiResponse.ok("Bill created", toResponse(bill)));
    }

    @GetMapping("/bills/{billId}")
    public ResponseEntity<ApiResponse<UtilityBillResponse>> getBill(@PathVariable Long billId) {
        return ResponseEntity.ok(ApiResponse.ok("Bill retrieved", toResponse(utilityBillService.getById(billId))));
    }

    @PatchMapping("/bills/{billId}/paid")
    public ResponseEntity<ApiResponse<UtilityBillResponse>> markPaid(@PathVariable Long billId) {
        return ResponseEntity.ok(ApiResponse.ok("Bill marked paid", toResponse(utilityBillService.markPaid(billId))));
    }

    /** Renter uploads payment proof image. */
    @PostMapping(value = "/bills/{billId}/payment-proof", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<UtilityBillResponse>> submitProof(
            @PathVariable Long billId,
            @RequestParam("image") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.ok("Payment proof submitted",
                toResponse(utilityBillService.submitPaymentProof(billId, file))));
    }

    /** Owner approves the payment proof. */
    @PatchMapping("/bills/{billId}/approve")
    public ResponseEntity<ApiResponse<UtilityBillResponse>> approve(@PathVariable Long billId) {
        return ResponseEntity.ok(ApiResponse.ok("Payment approved",
                toResponse(utilityBillService.approvePayment(billId))));
    }

    /** Owner rejects the payment proof. Body: { "reason": "..." } (optional). */
    @PatchMapping("/bills/{billId}/reject")
    public ResponseEntity<ApiResponse<UtilityBillResponse>> reject(
            @PathVariable Long billId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(ApiResponse.ok("Payment rejected",
                toResponse(utilityBillService.rejectPayment(billId, reason))));
    }
}
