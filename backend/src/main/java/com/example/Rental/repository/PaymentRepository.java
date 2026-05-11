package com.example.Rental.repository;

import com.example.Rental.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
}
