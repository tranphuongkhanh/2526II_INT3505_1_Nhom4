package com.example.Rental.repository;

import com.example.Rental.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    Page<Payment> findByOwnerId(Long ownerId, Pageable pageable);
    Page<Payment> findByOwnerIdAndStatus(Long ownerId, com.example.Rental.enums.PaymentStatus status, Pageable pageable);
}
