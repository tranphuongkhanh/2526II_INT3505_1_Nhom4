package com.example.Rental.controller;

import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.entity.Payment;
import com.example.Rental.entity.Post;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.enums.PaymentStatus;
import com.example.Rental.enums.UserRole;
import com.example.Rental.repository.PaymentRepository;
import com.example.Rental.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
class PaymentControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PaymentRepository paymentRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @Test
    void getMyPayments_shouldReturnPaymentsForOwner_withStatusFilterAndPagination() throws Exception {
        User owner = User.builder()
            .id(12L)
            .email("owner@example.com")
            .role(UserRole.OWNER)
            .build();

        Room room = Room.builder().id(10L).build();
        Post post = Post.builder().id(88L).room(room).build();
        Payment payment = Payment.builder()
            .id(1001L)
            .owner(owner)
            .post(post)
            .amount(new BigDecimal("150000"))
            .status(PaymentStatus.PAID)
            .note("Chuyen khoan")
            .paidAt(LocalDateTime.of(2026, 5, 1, 10, 0))
            .createdAt(LocalDateTime.of(2026, 5, 1, 9, 30))
            .build();

        Page<Payment> page = new PageImpl<>(
            List.of(payment),
            PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")),
            1
        );

        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(paymentRepository.findByOwnerIdAndStatus(eq(12L), eq(PaymentStatus.PAID), any(Pageable.class)))
            .thenReturn(page);

        mockMvc.perform(get("/api/v1/me/payments")
                .principal(() -> "owner@example.com")
                .param("status", "paid")
                .param("page", "1")
                .param("limit", "20")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("Payments retrieved successfully"))
            .andExpect(jsonPath("$.data.items[0].id").value(1001))
            .andExpect(jsonPath("$.data.items[0].owner_id").value(12))
            .andExpect(jsonPath("$.data.items[0].post_id").value(88))
            .andExpect(jsonPath("$.data.items[0].status").value("paid"))
            .andExpect(jsonPath("$.data.items[0].post.room_id").value(10))
            .andExpect(jsonPath("$.data.meta.total").value(1))
            .andExpect(jsonPath("$.data.meta.page").value(1))
            .andExpect(jsonPath("$.data.meta.limit").value(20));

        verify(paymentRepository, times(1))
            .findByOwnerIdAndStatus(eq(12L), eq(PaymentStatus.PAID), any(Pageable.class));
        verify(paymentRepository, never()).findByOwnerId(any(), any());
    }

    @Test
    void getMyPayments_shouldReturnForbidden_forNonOwner() throws Exception {
        User renter = User.builder()
            .id(23L)
            .email("renter@example.com")
            .role(UserRole.RENTER)
            .build();

        when(userRepository.findByEmail("renter@example.com")).thenReturn(Optional.of(renter));

        mockMvc.perform(get("/api/v1/me/payments")
            .principal(() -> "renter@example.com")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message", containsString("Only owners can view payment history")));
    }

    @Test
    void getMyPayments_shouldClampLimitTo100_whenClientPassesHigherValue() throws Exception {
        User owner = User.builder()
            .id(12L)
            .email("owner@example.com")
            .role(UserRole.OWNER)
            .build();

        Page<Payment> emptyPage = new PageImpl<>(
            List.of(),
            PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt")),
            0
        );

        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(paymentRepository.findByOwnerId(eq(12L), any(Pageable.class))).thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/me/payments")
            .principal(() -> "owner@example.com")
                .param("limit", "999")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.meta.limit").value(100));

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(paymentRepository).findByOwnerId(eq(12L), pageableCaptor.capture());
        org.junit.jupiter.api.Assertions.assertEquals(100, pageableCaptor.getValue().getPageSize());
    }

    @Test
    void getMyPayments_shouldReturnBadRequest_whenStatusIsInvalid() throws Exception {
        User owner = User.builder()
            .id(12L)
            .email("owner@example.com")
            .role(UserRole.OWNER)
            .build();

        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));

        mockMvc.perform(get("/api/v1/me/payments")
                .principal(() -> "owner@example.com")
                .param("status", "invalid")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message", containsString("Invalid status. Supported values: pending, paid")));
    }
}
