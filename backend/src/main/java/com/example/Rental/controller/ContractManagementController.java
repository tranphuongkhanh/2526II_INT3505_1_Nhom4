package com.example.Rental.controller;

import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.ContractResponse;
import com.example.Rental.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/contracts")
@RequiredArgsConstructor
public class ContractManagementController {

    private final ContractService contractService;

    @PatchMapping("/{contractId}/end")
    public ResponseEntity<ApiResponse<ContractResponse>> endContract(@PathVariable Long contractId, Principal principal) {
        String email = principal.getName();

        ContractResponse resp = contractService.endContract(contractId, email);
        return ResponseEntity.ok(ApiResponse.ok("Contract ended", resp));
    }
}
