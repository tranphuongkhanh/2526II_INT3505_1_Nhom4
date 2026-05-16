package com.example.Rental.controller;

import com.example.Rental.dto.request.CreateContractRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.ContractResponse;
import com.example.Rental.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    @PostMapping
    public ResponseEntity<ApiResponse<ContractResponse>> createContract(
        @PathVariable Long roomId,
        @RequestBody CreateContractRequest request,
        Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Unauthenticated"));
        }

        ContractResponse response = contractService.createContract(roomId, principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Contract created", response));
    }
}
