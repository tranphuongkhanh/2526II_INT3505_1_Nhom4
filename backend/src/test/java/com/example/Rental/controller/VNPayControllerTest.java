package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.entity.Payment;
import com.example.Rental.entity.Post;
import com.example.Rental.enums.PaymentStatus;
import com.example.Rental.enums.PostStatus;
import com.example.Rental.repository.PaymentRepository;
import com.example.Rental.repository.PostRepository;
import com.example.Rental.service.VNPayService;
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

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

@WebMvcTest(
    controllers = VNPayController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class VNPayControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VNPayService vnPayService;

    @MockBean
    private PaymentRepository paymentRepository;

    @MockBean
    private PostRepository postRepository;

    @Test
    public void testVnpayReturn_Success() throws Exception {
        Mockito.when(vnPayService.verifyPayment(any())).thenReturn(true);

        Post post = new Post();
        post.setId(1L);
        post.setStatus(PostStatus.APPROVED);
        post.setDurationType(com.example.Rental.enums.DurationType.MONTH);
        post.setDurationValue(1);

        Payment payment = new Payment();
        payment.setId(1L);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setPost(post);

        Mockito.when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));

        mockMvc.perform(get("/api/v1/payments/vnpay-return")
                .param("vnp_ResponseCode", "00")
                .param("vnp_TxnRef", "1_randomstring"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "http://localhost:5173/owner/payments?paymentStatus=success"));
    }

    @Test
    public void testVnpayReturn_InvalidSignature() throws Exception {
        Mockito.when(vnPayService.verifyPayment(any())).thenReturn(false);

        mockMvc.perform(get("/api/v1/payments/vnpay-return")
                .param("vnp_ResponseCode", "00")
                .param("vnp_TxnRef", "1_randomstring"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "http://localhost:5173/owner/payments?paymentStatus=invalid_signature"));
    }

    @Test
    public void testVnpayReturn_FailedPayment() throws Exception {
        Mockito.when(vnPayService.verifyPayment(any())).thenReturn(true);

        mockMvc.perform(get("/api/v1/payments/vnpay-return")
                .param("vnp_ResponseCode", "24")
                .param("vnp_TxnRef", "1_randomstring"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "http://localhost:5173/owner/payments?paymentStatus=failed"));
    }
}
