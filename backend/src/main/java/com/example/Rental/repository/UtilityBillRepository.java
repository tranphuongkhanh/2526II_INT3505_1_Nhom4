package com.example.Rental.repository;

import com.example.Rental.entity.UtilityBill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UtilityBillRepository extends JpaRepository<UtilityBill, Long> {
    List<UtilityBill> findByContractIdOrderByBillingMonthDesc(Long contractId);
    Optional<UtilityBill> findByContractIdAndBillingMonth(Long contractId, LocalDate billingMonth);
}
