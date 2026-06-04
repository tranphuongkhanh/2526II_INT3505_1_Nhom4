package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.dto.request.UtilityBillRequest;
import com.example.Rental.entity.RentalContract;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.entity.UtilityBill;
import com.example.Rental.enums.BillStatus;
import com.example.Rental.service.UtilityBillService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = UtilityBillController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class UtilityBillControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UtilityBillService utilityBillService;

    private UtilityBill mockUtilityBill(Long id) {
        User owner = new User();
        owner.setId(1L);

        Room room = new Room();
        room.setId(1L);
        room.setOwner(owner);

        RentalContract contract = new RentalContract();
        contract.setId(1L);

        UtilityBill bill = new UtilityBill();
        bill.setId(id);
        bill.setRoom(room);
        bill.setContract(contract);
        bill.setBillingMonth(LocalDate.of(2023, 10, 1));
        bill.setStatus(BillStatus.UNPAID);
        
        return bill;
    }

    @Test
    public void testListByContract_Success() throws Exception {
        UtilityBill bill = mockUtilityBill(1L);
        Mockito.when(utilityBillService.listByContract(1L)).thenReturn(List.of(bill));

        mockMvc.perform(get("/api/v1/contracts/1/bills"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(1));
    }

    @Test
    public void testCreateMonthly_Success() throws Exception {
        UtilityBillRequest request = new UtilityBillRequest();
        
        UtilityBill bill = mockUtilityBill(1L);
        Mockito.when(utilityBillService.createMonthlyBill(1L)).thenReturn(bill);

        mockMvc.perform(post("/api/v1/contracts/1/bills")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    public void testGetBill_Success() throws Exception {
        UtilityBill bill = mockUtilityBill(1L);
        Mockito.when(utilityBillService.getById(1L)).thenReturn(bill);

        mockMvc.perform(get("/api/v1/bills/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    public void testMarkPaid_Success() throws Exception {
        UtilityBill bill = mockUtilityBill(1L);
        bill.setStatus(BillStatus.PAID);
        Mockito.when(utilityBillService.markPaid(1L)).thenReturn(bill);

        mockMvc.perform(patch("/api/v1/bills/1/paid"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.status").value("PAID"));
    }

    @Test
    public void testSubmitProof_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile("image", "proof.jpg", "image/jpeg", "image data".getBytes());

        UtilityBill bill = mockUtilityBill(1L);
        bill.setStatus(BillStatus.AWAITING_APPROVAL);
        Mockito.when(utilityBillService.submitPaymentProof(eq(1L), any())).thenReturn(bill);

        mockMvc.perform(multipart("/api/v1/bills/1/payment-proof").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.status").value("AWAITING_APPROVAL"));
    }

    @Test
    public void testApprove_Success() throws Exception {
        UtilityBill bill = mockUtilityBill(1L);
        bill.setStatus(BillStatus.PAID);
        Mockito.when(utilityBillService.approvePayment(1L)).thenReturn(bill);

        mockMvc.perform(patch("/api/v1/bills/1/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.status").value("PAID"));
    }

    @Test
    public void testReject_Success() throws Exception {
        UtilityBill bill = mockUtilityBill(1L);
        bill.setStatus(BillStatus.UNPAID);
        Mockito.when(utilityBillService.rejectPayment(eq(1L), eq("Invalid proof"))).thenReturn(bill);

        mockMvc.perform(patch("/api/v1/bills/1/reject")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("reason", "Invalid proof"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.status").value("UNPAID"));
    }
}
