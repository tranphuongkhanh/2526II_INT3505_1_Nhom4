package com.example.Rental.repository;

import com.example.Rental.entity.RentalContract;
import com.example.Rental.enums.ContractStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RentalContractRepository extends JpaRepository<RentalContract, Long> {
    Optional<RentalContract> findByRoomIdAndStatus(Long roomId, ContractStatus status);
    List<RentalContract> findByRenterId(Long renterId);
    Page<RentalContract> findByRenterId(Long renterId, Pageable pageable);
    List<RentalContract> findByRoomId(Long roomId);
    Page<RentalContract> findByRoomId(Long roomId, Pageable pageable);
}
