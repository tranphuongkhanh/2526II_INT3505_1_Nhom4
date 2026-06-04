package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.dto.request.ContractQueryRequest;
import com.example.Rental.dto.response.ContractListResponse;
import com.example.Rental.dto.response.ContractResponse;
import com.example.Rental.dto.response.CursorPageResponse;
import com.example.Rental.service.ContractService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.web.servlet.MockMvc;

import java.security.Principal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = MeContractController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class MeContractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ContractService contractService;

    @Test
    public void testMyContracts_Success() throws Exception {
        Principal principal = Mockito.mock(Principal.class);
        Mockito.when(principal.getName()).thenReturn("user@gmail.com");

        ContractResponse contract = new ContractResponse();
        contract.setId(1L);

        ContractListResponse response = ContractListResponse.builder().items(List.of(contract)).build();

        Mockito.when(contractService.listContractsForRenter(eq("user@gmail.com"), any(ContractQueryRequest.class))).thenReturn(response);

        mockMvc.perform(get("/api/v1/me/contracts")
                .principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items[0].id").value(1));
    }

    @Test
    public void testMyContractsCursor_Success() throws Exception {
        Principal principal = Mockito.mock(Principal.class);
        Mockito.when(principal.getName()).thenReturn("user@gmail.com");

        ContractResponse contract = new ContractResponse();
        contract.setId(1L);

        CursorPageResponse<ContractResponse> response = new CursorPageResponse<>(List.of(contract), null);

        Mockito.when(contractService.listContractsForRenterCursor(eq("user@gmail.com"), any(), eq(20))).thenReturn(response);

        mockMvc.perform(get("/api/v1/me/contracts/cursor")
                .principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items[0].id").value(1));
    }

    @Test
    public void testCurrentRent_Success() throws Exception {
        Principal principal = Mockito.mock(Principal.class);
        Mockito.when(principal.getName()).thenReturn("user@gmail.com");

        ContractResponse contract = new ContractResponse();
        contract.setId(1L);

        Mockito.when(contractService.getCurrentRent(eq("user@gmail.com"))).thenReturn(contract);

        mockMvc.perform(get("/api/v1/me/current-rent")
                .principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1));
    }
}
