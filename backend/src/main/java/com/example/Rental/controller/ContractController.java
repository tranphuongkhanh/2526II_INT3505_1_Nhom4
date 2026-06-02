package com.example.Rental.controller;

import com.example.Rental.dto.request.ContractQueryRequest;
import com.example.Rental.dto.request.CreateContractRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.ContractListResponse;
import com.example.Rental.dto.response.ContractResponse;
import com.example.Rental.dto.response.CursorPageResponse;
import com.example.Rental.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.security.Principal;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/contracts")
@RequiredArgsConstructor
public class ContractController {

	private final ContractService contractService;

	@GetMapping
	public ResponseEntity<ApiResponse<ContractListResponse>> listContracts(
		@PathVariable Long roomId,
		@RequestParam(required = false, defaultValue = "1") Integer page,
		@RequestParam(required = false, defaultValue = "20") Integer limit,
		Principal principal
	) {
		String email = principal.getName();

		ContractQueryRequest query = ContractQueryRequest.builder().page(page).limit(limit).build();
		ContractListResponse response = contractService.listContracts(roomId, email, query);
		return ResponseEntity.ok(ApiResponse.ok("Contracts retrieved", response));
	}

	@GetMapping("/cursor")
	public ResponseEntity<ApiResponse<CursorPageResponse<ContractResponse>>> listContractsCursor(
		@PathVariable Long roomId,
		@RequestParam(required = false) Long cursor,
		@RequestParam(defaultValue = "20") int limit,
		Principal principal
	) {
		String email = principal.getName();
		CursorPageResponse<ContractResponse> response = contractService.listContractsCursor(roomId, email, cursor, limit);
		return ResponseEntity.ok(ApiResponse.ok("Contracts retrieved", response));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<ContractResponse>> createContract(
		@PathVariable Long roomId,
		@Valid @RequestBody CreateContractRequest req,
		Principal principal
	) {
		String email = principal.getName();

		ContractResponse resp = contractService.createContract(roomId, email, req);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Contract created", resp));
	}

}
