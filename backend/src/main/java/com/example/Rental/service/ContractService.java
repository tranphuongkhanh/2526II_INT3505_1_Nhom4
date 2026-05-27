package com.example.Rental.service;

import com.example.Rental.dto.request.ContractQueryRequest;
import com.example.Rental.dto.response.ContractListResponse;
import com.example.Rental.dto.response.ContractResponse;
import com.example.Rental.entity.RentalContract;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.enums.ContractStatus;
import com.example.Rental.enums.UserRole;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.RentalContractRepository;
import com.example.Rental.repository.RoomRepository;
import com.example.Rental.repository.UserRepository;
import com.example.Rental.service.NotificationService;
import com.example.Rental.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class ContractService {

	private final RentalContractRepository rentalContractRepository;
	private final RoomRepository roomRepository;
	private final UserRepository userRepository;
	private final NotificationService notificationService;

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

		List<ContractResponse> items = contracts.getContent().stream()
			.map(this::toResponse).collect(Collectors.toList());

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
			.status(ContractStatus.PENDING_RENTER_SIGNATURE)
			.build();

		rentalContractRepository.save(contract);

		try {
			notificationService.createAndSendNotification(
				renter,
				NotificationType.CONTRACT_CREATED,
				"Hợp đồng chờ ký xác nhận",
				"Chủ nhà đã gửi hợp đồng thuê phòng cho bạn. Vui lòng xem xét và ký xác nhận.",
				"contract",
				contract.getId()
			);
		} catch (Exception e) {
			log.warn("Failed to send contract creation notification to renter {}: {}", renter.getEmail(), e.getMessage());
		}

		return toResponse(contract);
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

		List<ContractResponse> items = contracts.getContent().stream()
			.map(this::toResponse).collect(Collectors.toList());

		return ContractListResponse.builder()
			.items(items)
			.meta(com.example.Rental.dto.response.PaginationMetaResponse.builder()
				.total(contracts.getTotalElements())
				.page(page)
				.limit(limit)
				.build())
			.build();
	}

	@Transactional(readOnly = true)
	public ContractResponse getCurrentRent(String renterEmail) {
		User renter = userRepository.findByEmail(renterEmail)
			.orElseThrow(() -> new EntityNotFoundException("User not found"));

		if (renter.getRole() != UserRole.RENTER) {
			throw new AccessDeniedException("Only renters can view current rent");
		}

		return rentalContractRepository
			.findFirstByRenterIdAndStatusOrderByCreatedAtDesc(renter.getId(), ContractStatus.ACTIVE)
			.map(this::toResponse)
			.orElse(null);
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

		contract.setStatus(ContractStatus.ENDED);
		room.setRentalStatus(com.example.Rental.enums.RentalStatus.AVAILABLE);

		rentalContractRepository.save(contract);
		roomRepository.save(room);

		return toResponse(contract);
	}

	@Transactional
	public ContractResponse signContract(Long contractId, String renterEmail) {
		RentalContract contract = rentalContractRepository.findById(contractId)
			.orElseThrow(() -> new EntityNotFoundException("Contract not found"));

		User renter = userRepository.findByEmail(renterEmail)
			.orElseThrow(() -> new EntityNotFoundException("User not found"));

		if (!contract.getRenter().getId().equals(renter.getId())) {
			throw new org.springframework.security.access.AccessDeniedException("You are not the renter of this contract");
		}

		if (contract.getStatus() != ContractStatus.PENDING_RENTER_SIGNATURE) {
			throw new IllegalStateException("Contract is not awaiting renter signature");
		}

		contract.setStatus(ContractStatus.ACTIVE);
		contract.getRoom().setRentalStatus(com.example.Rental.enums.RentalStatus.RENTED);

		rentalContractRepository.save(contract);
		roomRepository.save(contract.getRoom());

		try {
			notificationService.createAndSendNotification(
				contract.getRoom().getOwner(),
				NotificationType.CONTRACT_SIGNED,
				"Hợp đồng đã được ký",
				"Người thuê " + renter.getFullName() + " đã ký xác nhận hợp đồng thuê phòng.",
				"contract",
				contract.getId()
			);
		} catch (Exception e) {
			log.warn("Failed to send contract signed notification to owner: {}", e.getMessage());
		}

		return toResponse(contract);
	}

	private ContractResponse toResponse(RentalContract c) {
		User renter = c.getRenter();
		Room room = c.getRoom();
		User owner = room.getOwner();
		return ContractResponse.builder()
			.id(c.getId())
			.roomId(room.getId())
			.renterId(renter.getId())
			.renterName(renter.getFullName())
			.renterPhone(renter.getPhone())
			.status(c.getStatus().name().toLowerCase(Locale.ROOT))
			.startDate(c.getStartDate())
			.endDate(c.getEndDate())
			.monthlyRent(c.getMonthlyRent())
			.electricityPrice(c.getElectricityPrice())
			.waterPrice(c.getWaterPrice())
			.createdAt(c.getCreatedAt())
			.roomTitle(room.getTitle())
			.roomAddress(room.getAddress())
			.roomWard(room.getWard())
			.roomDistrict(room.getDistrict())
			.roomCity(room.getCity())
			.ownerName(owner != null ? owner.getFullName() : null)
			.ownerPhone(owner != null ? owner.getPhone() : null)
			.build();
	}
}
