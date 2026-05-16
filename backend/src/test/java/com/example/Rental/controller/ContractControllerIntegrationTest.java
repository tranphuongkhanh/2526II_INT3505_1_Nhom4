package com.example.Rental.controller;

import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.entity.RentalContract;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.enums.UserRole;
import com.example.Rental.repository.RentalContractRepository;
import com.example.Rental.repository.RoomRepository;
import com.example.Rental.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
    properties = {
        "spring.autoconfigure.exclude=" +
            "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
            "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration"
    }
)
@AutoConfigureMockMvc(addFilters = false)
class ContractControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RentalContractRepository rentalContractRepository;

    @MockBean
    private RoomRepository roomRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private com.example.Rental.repository.PaymentRepository paymentRepository;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @Test
    void createContract_shouldCreateAndUpdateRoom_whenOwnerCreates() throws Exception {
        User owner = User.builder().id(5L).email("owner@example.com").role(UserRole.OWNER).build();
        User renter = User.builder().id(11L).email("renter@example.com").role(UserRole.RENTER).build();
        Room room = Room.builder().id(20L).owner(owner).build();

        RentalContract saved = RentalContract.builder()
            .id(300L)
            .room(room)
            .renter(renter)
            .startDate(LocalDate.of(2026,6,1))
            .endDate(LocalDate.of(2026,12,1))
            .monthlyRent(new BigDecimal("5000000"))
            .electricityPrice(new BigDecimal("2000"))
            .waterPrice(new BigDecimal("1000"))
            .createdAt(LocalDateTime.now())
            .build();

        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(userRepository.findById(11L)).thenReturn(Optional.of(renter));
        when(roomRepository.findById(20L)).thenReturn(Optional.of(room));
        when(rentalContractRepository.save(any())).thenReturn(saved);

        String body = "{\"renter_id\":11,\"start_date\":\"2026-06-01\",\"end_date\":\"2026-12-01\",\"monthly_rent\":\"5000000\",\"electricity_price\":\"2000\",\"water_price\":\"1000\"}";

        mockMvc.perform(post("/api/v1/rooms/20/contracts")
                .principal(() -> "owner@example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .accept(MediaType.APPLICATION_JSON))
            .andDo(print())
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("Contract created"))
            .andExpect(jsonPath("$.data.id").value(300))
            .andExpect(jsonPath("$.data.room_id").value(20))
            .andExpect(jsonPath("$.data.renter_id").value(11));

        ArgumentCaptor<Room> roomCaptor = ArgumentCaptor.forClass(Room.class);
        verify(roomRepository, times(1)).save(roomCaptor.capture());
        Room updated = roomCaptor.getValue();
        org.junit.jupiter.api.Assertions.assertNotNull(updated.getRentalStatus());

        verify(rentalContractRepository, times(1)).save(any());
    }

    @Test
    void createContract_shouldReturnForbidden_forNonOwner() throws Exception {
        User renter = User.builder().id(11L).email("renter@example.com").role(UserRole.RENTER).build();
        when(userRepository.findByEmail("renter@example.com")).thenReturn(Optional.of(renter));

        String body = "{\"renter_id\":11,\"start_date\":\"2026-06-01\",\"end_date\":\"2026-12-01\",\"monthly_rent\":\"5000000\",\"electricity_price\":\"2000\",\"water_price\":\"1000\"}";

        mockMvc.perform(post("/api/v1/rooms/20/contracts")
                .principal(() -> "renter@example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message", containsString("Only owners can create contracts")));
    }
}
