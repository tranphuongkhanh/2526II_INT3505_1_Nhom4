package com.example.Rental.controller;

import com.example.Rental.dto.request.ContractQueryRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.ContractListResponse;
import com.example.Rental.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
public class MeContractController {

    private final ContractService contractService;

    @GetMapping("/contracts")
    public ResponseEntity<ApiResponse<ContractListResponse>> myContracts(
        @RequestParam(required = false, defaultValue = "1") Integer page,
        @RequestParam(required = false, defaultValue = "20") Integer limit,
        Principal principal
    ) {
        // Let Spring Security handle unauthenticated requests.
        String email = principal.getName();

        ContractQueryRequest query = ContractQueryRequest.builder().page(page).limit(limit).build();
        ContractListResponse resp = contractService.listContractsForRenter(email, query);
        return ResponseEntity.ok(ApiResponse.ok("Contracts retrieved", resp));
    }
}
