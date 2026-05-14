package com.example.Rental.repository;

import com.example.Rental.entity.Payment;
import com.example.Rental.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @EntityGraph(attributePaths = {"post", "post.room", "extension"})
    Page<Payment> findByOwnerId(Long ownerId, Pageable pageable);

    @EntityGraph(attributePaths = {"post", "post.room", "extension"})
    Page<Payment> findByOwnerIdAndStatus(Long ownerId, PaymentStatus status, Pageable pageable);

    List<Payment> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
}
