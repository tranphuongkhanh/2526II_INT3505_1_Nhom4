package com.example.Rental.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.Rental.entity.RentalContract;
import com.example.Rental.enums.ContractStatus;

public interface RentalContractRepository extends JpaRepository<RentalContract, Long> {
    Optional<RentalContract> findByRoomIdAndStatus(Long roomId, ContractStatus status);
    Optional<RentalContract> findFirstByRenterIdAndStatusOrderByCreatedAtDesc(Long renterId, ContractStatus status);
    Optional<RentalContract> findFirstByRenterIdAndRoomIdOrderByCreatedAtDesc(Long renterId, Long roomId);
    List<RentalContract> findByRenterId(Long renterId);
    Page<RentalContract> findByRenterId(Long renterId, Pageable pageable);
    List<RentalContract> findByRoomId(Long roomId);
    Page<RentalContract> findByRoomId(Long roomId, Pageable pageable);
    Optional<RentalContract> findFirstByRenterIdAndRoomIdOrderByCreatedAtDesc(Long renterId, Long roomId);
}
