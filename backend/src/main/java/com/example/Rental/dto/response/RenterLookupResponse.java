package com.example.Rental.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Minimal renter info returned to owners when looking up a renter by exact email
 * to draft a contract. Personal details (full email, phone, full name, address)
 * are intentionally NOT exposed — only the id needed to bind the contract and
 * masked previews so the owner can confirm the right account.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RenterLookupResponse {
    private Long id;
    private String maskedEmail;
    private String maskedName;
}
