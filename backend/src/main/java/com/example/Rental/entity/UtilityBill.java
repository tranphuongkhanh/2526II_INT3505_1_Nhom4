package com.example.Rental.entity;

import com.example.Rental.enums.BillStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "utility_bills", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"contract_id", "billing_month"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UtilityBill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private RentalContract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "billing_month", nullable = false)
    private LocalDate billingMonth;

    @Column(name = "elec_prev", nullable = false)
    private Integer elecPrev;

    @Column(name = "elec_curr", nullable = false)
    private Integer elecCurr;

    @Column(name = "elec_usage", nullable = false)
    private Integer elecUsage;

    @Column(name = "elec_unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal elecUnitPrice;

    @Column(name = "elec_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal elecAmount;

    @Column(name = "water_prev", nullable = false)
    private Integer waterPrev;

    @Column(name = "water_curr", nullable = false)
    private Integer waterCurr;

    @Column(name = "water_usage", nullable = false)
    private Integer waterUsage;

    @Column(name = "water_unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal waterUnitPrice;

    @Column(name = "water_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal waterAmount;

    @Column(name = "rent_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal rentAmount;

    @Column(name = "service_fee", precision = 12, scale = 2)
    private BigDecimal serviceFee = BigDecimal.ZERO;

    @Column(name = "wifi_fee", precision = 12, scale = 2)
    private BigDecimal wifiFee = BigDecimal.ZERO;

    @Column(name = "bike_parking_fee", precision = 12, scale = 2)
    private BigDecimal bikeParkingFee = BigDecimal.ZERO;

    @Column(name = "extra_fee", precision = 12, scale = 2)
    private BigDecimal extraFee = BigDecimal.ZERO;

    @Column(name = "extra_note", columnDefinition = "TEXT")
    private String extraNote;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(255)")
    private BillStatus status = BillStatus.UNPAID;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "payment_proof_url", columnDefinition = "TEXT")
    private String paymentProofUrl;

    @Column(name = "proof_submitted_at")
    private LocalDateTime proofSubmittedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
