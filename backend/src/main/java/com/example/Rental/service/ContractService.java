package com.example.Rental.service;

import com.example.Rental.dto.request.CreateContractRequest;
import com.example.Rental.dto.response.ContractResponse;
import com.example.Rental.entity.RentalContract;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.enums.ContractStatus;
import com.example.Rental.enums.RentalStatus;
import com.example.Rental.enums.UserRole;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.RentalContractRepository;
import com.example.Rental.repository.RoomRepository;
import com.example.Rental.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final RentalContractRepository rentalContractRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    @Transactional
    public ContractResponse createContract(Long roomId, String ownerEmail, CreateContractRequest request) {
        User owner = userRepository.findByEmail(ownerEmail)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (owner.getRole() != UserRole.OWNER) {
            throw new AccessDeniedException("Only owners can create contracts");
        }

        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new EntityNotFoundException("Room not found"));

        if (room.getOwner() == null || !room.getOwner().getId().equals(owner.getId())) {
            throw new AccessDeniedException("You are not the owner of this room");
        }

        User renter = userRepository.findById(request.getRenterId())
            .orElseThrow(() -> new EntityNotFoundException("Renter not found"));

        RentalContract contract = RentalContract.builder()
            .room(room)
            .renter(renter)
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .monthlyRent(request.getMonthlyRent())
            .electricityPrice(request.getElectricityPrice())
            .waterPrice(request.getWaterPrice())
            .status(ContractStatus.ACTIVE)
            .build();

        RentalContract saved = rentalContractRepository.save(contract);

        // update room rental status
        room.setRentalStatus(RentalStatus.RENTED);
        roomRepository.save(room);

        return ContractResponse.builder()
            .id(saved.getId())
            .roomId(room.getId())
            .renterId(renter.getId())
            .status(saved.getStatus().name().toLowerCase(Locale.ROOT))
            .startDate(saved.getStartDate())
            .endDate(saved.getEndDate())
            .monthlyRent(saved.getMonthlyRent())
            .electricityPrice(saved.getElectricityPrice())
            .waterPrice(saved.getWaterPrice())
            .createdAt(saved.getCreatedAt())
            .build();
    }
}
