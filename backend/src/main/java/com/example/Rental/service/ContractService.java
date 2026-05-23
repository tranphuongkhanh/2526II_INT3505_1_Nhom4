package com.example.Rental.service;

import com.example.Rental.dto.request.ContractQueryRequest;
import com.example.Rental.dto.response.ContractListResponse;
import com.example.Rental.dto.response.ContractResponse;
import com.example.Rental.entity.RentalContract;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.enums.UserRole;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.RentalContractRepository;
import com.example.Rental.repository.RoomRepository;
import com.example.Rental.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class ContractService {

	private final RentalContractRepository rentalContractRepository;
	private final RoomRepository roomRepository;
	private final UserRepository userRepository;

	@Transactional(readOnly = true)
	public ContractListResponse listContracts(Long roomId, String ownerEmail, ContractQueryRequest query) {
		User owner = userRepository.findByEmail(ownerEmail).orElseThrow(() -> new EntityNotFoundException("User not found"));

		if (owner.getRole() != UserRole.OWNER) {
			throw new AccessDeniedException("Only owners can view contracts");
		}

		Room room = roomRepository.findById(roomId).orElseThrow(() -> new EntityNotFoundException("Room not found"));

		if (room.getOwner() == null || !room.getOwner().getId().equals(owner.getId())) {
			throw new AccessDeniedException("You are not the owner of this room");
		}

		int page = (query.getPage() == null || query.getPage() < 1) ? 1 : query.getPage();
		int limit = (query.getLimit() == null || query.getLimit() < 1) ? 20 : query.getLimit();
		limit = Math.min(limit, 100);

		Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
		Page<RentalContract> contracts = rentalContractRepository.findByRoomId(roomId, pageable);

		List<ContractResponse> items = contracts.getContent().stream().map(c ->
			ContractResponse.builder()
				.id(c.getId())
				.roomId(c.getRoom().getId())
				.renterId(c.getRenter().getId())
				.status(c.getStatus().name().toLowerCase(Locale.ROOT))
				.startDate(c.getStartDate())
				.endDate(c.getEndDate())
				.monthlyRent(c.getMonthlyRent())
				.electricityPrice(c.getElectricityPrice())
				.waterPrice(c.getWaterPrice())
				.createdAt(c.getCreatedAt())
				.build()
		).collect(Collectors.toList());

		return ContractListResponse.builder()
			.items(items)
			.meta(com.example.Rental.dto.response.PaginationMetaResponse.builder()
				.total(contracts.getTotalElements())
				.page(page)
				.limit(limit)
				.build())
			.build();
	}

	@Transactional
	public ContractResponse createContract(Long roomId, String ownerEmail, com.example.Rental.dto.request.CreateContractRequest req) {
		User owner = userRepository.findByEmail(ownerEmail).orElseThrow(() -> new com.example.Rental.exception.EntityNotFoundException("User not found"));
		Room room = roomRepository.findById(roomId).orElseThrow(() -> new com.example.Rental.exception.EntityNotFoundException("Room not found"));
		User renter = userRepository.findById(req.getRenterId()).orElseThrow(() -> new com.example.Rental.exception.EntityNotFoundException("Renter not found"));

		if (owner.getRole() != UserRole.OWNER) {
			throw new AccessDeniedException("Only owners can create contracts");
		}

		if (room.getOwner() == null || !room.getOwner().getId().equals(owner.getId())) {
			throw new AccessDeniedException("You are not the owner of this room");
		}

		if (renter.getRole() != UserRole.RENTER) {
			throw new AccessDeniedException("Contract renter must have renter role");
		}

		if (room.getRentalStatus() != com.example.Rental.enums.RentalStatus.AVAILABLE) {
			throw new IllegalStateException("Room is not available");
		}

		RentalContract contract = RentalContract.builder()
			.room(room)
			.renter(renter)
			.startDate(req.getStartDate() == null ? LocalDate.now() : req.getStartDate())
			.endDate(req.getEndDate())
			.monthlyRent(req.getMonthlyRent() == null ? BigDecimal.ZERO : req.getMonthlyRent())
			.electricityPrice(req.getElectricityPrice() == null ? BigDecimal.ZERO : req.getElectricityPrice())
			.waterPrice(req.getWaterPrice() == null ? BigDecimal.ZERO : req.getWaterPrice())
			.status(com.example.Rental.enums.ContractStatus.ACTIVE)
			.build();

		room.setRentalStatus(com.example.Rental.enums.RentalStatus.RENTED);

		rentalContractRepository.save(contract);
		roomRepository.save(room);

		return ContractResponse.builder()
			.id(contract.getId())
			.roomId(room.getId())
			.renterId(renter.getId())
			.status(contract.getStatus().name().toLowerCase(Locale.ROOT))
			.startDate(contract.getStartDate())
			.endDate(contract.getEndDate())
			.monthlyRent(contract.getMonthlyRent())
			.electricityPrice(contract.getElectricityPrice())
			.waterPrice(contract.getWaterPrice())
			.createdAt(contract.getCreatedAt())
			.build();
	}

	@Transactional(readOnly = true)
	public ContractListResponse listContractsForRenter(String renterEmail, ContractQueryRequest query) {
		User renter = userRepository.findByEmail(renterEmail).orElseThrow(() -> new com.example.Rental.exception.EntityNotFoundException("User not found"));

		if (renter.getRole() != UserRole.RENTER) {
			throw new AccessDeniedException("Only renters can view renter contracts");
		}

		int page = (query.getPage() == null || query.getPage() < 1) ? 1 : query.getPage();
		int limit = (query.getLimit() == null || query.getLimit() < 1) ? 20 : query.getLimit();
		limit = Math.min(limit, 100);

		Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
		org.springframework.data.domain.Page<RentalContract> contracts = rentalContractRepository.findByRenterId(renter.getId(), pageable);

		List<ContractResponse> items = contracts.getContent().stream().map(c ->
			ContractResponse.builder()
				.id(c.getId())
				.roomId(c.getRoom().getId())
				.renterId(c.getRenter().getId())
				.status(c.getStatus().name().toLowerCase(Locale.ROOT))
				.startDate(c.getStartDate())
				.endDate(c.getEndDate())
				.monthlyRent(c.getMonthlyRent())
				.electricityPrice(c.getElectricityPrice())
				.waterPrice(c.getWaterPrice())
				.createdAt(c.getCreatedAt())
				.build()
		).collect(Collectors.toList());

		return ContractListResponse.builder()
			.items(items)
			.meta(com.example.Rental.dto.response.PaginationMetaResponse.builder()
				.total(contracts.getTotalElements())
				.page(page)
				.limit(limit)
				.build())
			.build();
	}

	@Transactional
	public ContractResponse endContract(Long contractId, String principalEmail) {
		RentalContract contract = rentalContractRepository.findById(contractId).orElseThrow(() -> new com.example.Rental.exception.EntityNotFoundException("Contract not found"));
		Room room = contract.getRoom();
		User principal = userRepository.findByEmail(principalEmail).orElseThrow(() -> new com.example.Rental.exception.EntityNotFoundException("User not found"));

		boolean isOwner = room.getOwner() != null && room.getOwner().getId().equals(principal.getId());
		boolean isRenter = contract.getRenter() != null && contract.getRenter().getId().equals(principal.getId());

		if (!isOwner && !isRenter) {
			throw new org.springframework.security.access.AccessDeniedException("Only owner or renter can end the contract");
		}

		contract.setStatus(com.example.Rental.enums.ContractStatus.ENDED);
		room.setRentalStatus(com.example.Rental.enums.RentalStatus.AVAILABLE);

		rentalContractRepository.save(contract);
		roomRepository.save(room);

		return ContractResponse.builder()
			.id(contract.getId())
			.roomId(room.getId())
			.renterId(contract.getRenter().getId())
			.status(contract.getStatus().name().toLowerCase(Locale.ROOT))
			.startDate(contract.getStartDate())
			.endDate(contract.getEndDate())
			.monthlyRent(contract.getMonthlyRent())
			.electricityPrice(contract.getElectricityPrice())
			.waterPrice(contract.getWaterPrice())
			.createdAt(contract.getCreatedAt())
			.build();
	}
}
