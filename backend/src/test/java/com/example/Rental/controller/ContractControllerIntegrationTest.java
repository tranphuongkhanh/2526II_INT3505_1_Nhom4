package com.example.Rental.controller;

import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.dto.request.CreateContractRequest;
import com.example.Rental.entity.RentalContract;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.enums.ContractStatus;
import com.example.Rental.enums.RentalStatus;
import com.example.Rental.enums.UserRole;
import com.example.Rental.repository.RentalContractRepository;
import com.example.Rental.repository.RoomRepository;
import com.example.Rental.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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

    // Additional repositories required to satisfy the full bean graph when JPA
    // auto-configuration is excluded. Without these mocks, services such as
    // PostService / NotificationService / etc. fail to wire and the ApplicationContext
    // cannot load.
    @MockBean
    private com.example.Rental.repository.PostRepository postRepository;

    @MockBean
    private com.example.Rental.repository.PostViewRepository postViewRepository;

    @MockBean
    private com.example.Rental.repository.PostExtensionRepository postExtensionRepository;

    @MockBean
    private com.example.Rental.repository.FavoriteRepository favoriteRepository;

    @MockBean
    private com.example.Rental.repository.RoomImageRepository roomImageRepository;

    @MockBean
    private com.example.Rental.repository.ReviewRepository reviewRepository;

    @MockBean
    private com.example.Rental.repository.ReportRepository reportRepository;

    @MockBean
    private com.example.Rental.repository.NotificationRepository notificationRepository;

    @MockBean
    private com.example.Rental.repository.ConversationRepository conversationRepository;

    @MockBean
    private com.example.Rental.repository.MessageRepository messageRepository;

    @MockBean
    private com.example.Rental.repository.UtilityBillRepository utilityBillRepository;

    @MockBean
    private com.example.Rental.repository.VehicleRepository vehicleRepository;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @Test
    void createContract_shouldStartAsPendingRenterSignature_forOwner() throws Exception {
        User owner = User.builder().id(5L).email("owner@example.com").role(UserRole.OWNER).build();
        User renter = User.builder().id(11L).email("renter@example.com").role(UserRole.RENTER).build();
        Room room = Room.builder().id(20L).owner(owner).rentalStatus(RentalStatus.AVAILABLE).build();

        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(userRepository.findById(11L)).thenReturn(Optional.of(renter));
        when(roomRepository.findById(20L)).thenReturn(Optional.of(room));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(rentalContractRepository.save(any(RentalContract.class))).thenAnswer(invocation -> {
            RentalContract saved = invocation.getArgument(0);
            saved.setId(401L);
            return saved;
        });

        mockMvc.perform(post("/api/v1/rooms/20/contracts")
                .principal(() -> "owner@example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "renter_id": 11,
                      "start_date": "2026-06-01",
                      "end_date": "2026-12-01",
                      "monthly_rent": 5000000,
                      "electricity_price": 2000,
                      "water_price": 1000
                    }
                    """)
                .accept(MediaType.APPLICATION_JSON))
            .andDo(print())
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.id").value(401))
            // New flow: contract starts in PENDING_RENTER_SIGNATURE; only becomes
            // ACTIVE after the renter signs. Room rental status is also not
            // flipped to RENTED until then.
            .andExpect(jsonPath("$.data.status").value("pending_renter_signature"));
    }

    @Test
    void listContracts_shouldReturnPagedContracts_forOwner() throws Exception {
        User owner = User.builder().id(5L).email("owner@example.com").role(UserRole.OWNER).build();
        User renter = User.builder().id(11L).email("renter@example.com").role(UserRole.RENTER).build();
        Room room = Room.builder().id(20L).owner(owner).build();

        RentalContract contract = RentalContract.builder()
            .id(400L)
            .room(room)
            .renter(renter)
            .status(com.example.Rental.enums.ContractStatus.ACTIVE)
            .startDate(LocalDate.of(2026,6,1))
            .endDate(LocalDate.of(2026,12,1))
            .monthlyRent(new BigDecimal("5000000"))
            .electricityPrice(new BigDecimal("2000"))
            .waterPrice(new BigDecimal("1000"))
            .createdAt(LocalDateTime.now())
            .build();

        Page<RentalContract> page = new PageImpl<>(List.of(contract), PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")), 1);

        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(roomRepository.findById(20L)).thenReturn(Optional.of(room));
        when(rentalContractRepository.findByRoomId(eq(20L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/rooms/20/contracts")
                .principal(() -> "owner@example.com")
                .param("page", "1")
                .param("limit", "20")
                .accept(MediaType.APPLICATION_JSON))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.items[0].id").value(400))
            .andExpect(jsonPath("$.data.meta.total").value(1));
    }

    @Test
    void listContracts_shouldReturnForbidden_forNonOwner() throws Exception {
        User renter = User.builder().id(11L).email("renter@example.com").role(UserRole.RENTER).build();
        when(userRepository.findByEmail("renter@example.com")).thenReturn(Optional.of(renter));

        mockMvc.perform(get("/api/v1/rooms/20/contracts")
                .principal(() -> "renter@example.com")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message", containsString("Only owners can view contracts")));
    }

    @Test
    void listMyContracts_shouldReturnPagedContracts_forRenter() throws Exception {
        User renter = User.builder().id(11L).email("renter@example.com").role(UserRole.RENTER).build();
        User owner = User.builder().id(5L).email("owner@example.com").role(UserRole.OWNER).build();
        Room room = Room.builder().id(20L).owner(owner).build();

        RentalContract contract = RentalContract.builder()
            .id(500L)
            .room(room)
            .renter(renter)
            .status(ContractStatus.ACTIVE)
            .startDate(LocalDate.of(2026,6,1))
            .endDate(LocalDate.of(2026,12,1))
            .monthlyRent(new BigDecimal("5000000"))
            .electricityPrice(new BigDecimal("2000"))
            .waterPrice(new BigDecimal("1000"))
            .createdAt(LocalDateTime.now())
            .build();

        Page<RentalContract> page = new PageImpl<>(List.of(contract), PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")), 1);

        when(userRepository.findByEmail("renter@example.com")).thenReturn(Optional.of(renter));
        when(rentalContractRepository.findByRenterId(eq(11L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/me/contracts")
                .principal(() -> "renter@example.com")
                .accept(MediaType.APPLICATION_JSON))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.items[0].id").value(500))
            .andExpect(jsonPath("$.data.meta.total").value(1));
    }

    @Test
    void endContract_shouldSetRoomAvailable_forOwner() throws Exception {
        User owner = User.builder().id(5L).email("owner@example.com").role(UserRole.OWNER).build();
        User renter = User.builder().id(11L).email("renter@example.com").role(UserRole.RENTER).build();
        Room room = Room.builder().id(20L).owner(owner).rentalStatus(RentalStatus.RENTED).build();
        RentalContract contract = RentalContract.builder()
            .id(600L)
            .room(room)
            .renter(renter)
            .status(ContractStatus.ACTIVE)
            .startDate(LocalDate.of(2026,6,1))
            .endDate(LocalDate.of(2026,12,1))
            .monthlyRent(new BigDecimal("5000000"))
            .electricityPrice(new BigDecimal("2000"))
            .waterPrice(new BigDecimal("1000"))
            .createdAt(LocalDateTime.now())
            .build();

        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(rentalContractRepository.findById(600L)).thenReturn(Optional.of(contract));
        when(rentalContractRepository.save(any(RentalContract.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(patch("/api/v1/contracts/600/end")
                .principal(() -> "owner@example.com")
                .accept(MediaType.APPLICATION_JSON))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.id").value(600))
            .andExpect(jsonPath("$.data.status").value("ended"));

        org.junit.jupiter.api.Assertions.assertEquals(RentalStatus.AVAILABLE, room.getRentalStatus());
    }
}
