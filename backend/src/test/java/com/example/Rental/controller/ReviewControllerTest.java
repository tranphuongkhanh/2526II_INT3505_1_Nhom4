package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.dto.request.RenterReviewRequest;
import com.example.Rental.dto.request.ReviewRequest;
import com.example.Rental.dto.request.ReviewUpdateRequest;
import com.example.Rental.dto.response.PageCacheWrapper;
import com.example.Rental.dto.response.ReviewResponse;
import com.example.Rental.service.ReviewService;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.security.Principal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = ReviewController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class ReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReviewService reviewService;

    @Test
    public void testGetRoomReviews_Success() throws Exception {
        ReviewResponse response = ReviewResponse.builder().id(1L).rating(5).comment("Good").build();
        PageCacheWrapper<ReviewResponse> wrapper = PageCacheWrapper.of(new PageImpl<>(List.of(response)));
        
        Mockito.when(reviewService.getApprovedRoomReviews(eq(1L), any())).thenReturn(wrapper);

        mockMvc.perform(get("/api/v1/rooms/1/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items[0].id").value(1))
                .andExpect(jsonPath("$.data.items[0].rating").value(5));
    }

    @Test
    public void testCreateRoomReview_Success() throws Exception {
        Principal mockPrincipal = Mockito.mock(Principal.class);
        Mockito.when(mockPrincipal.getName()).thenReturn("user@gmail.com");

        ReviewRequest request = new ReviewRequest();
        request.setRating(4);
        request.setComment("Nice");
        
        Mockito.doNothing().when(reviewService).createRoomReview(eq(1L), any(ReviewRequest.class), eq("user@gmail.com"));

        mockMvc.perform(post("/api/v1/rooms/1/reviews")
                .principal(mockPrincipal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Review submitted and pending approval"));
    }

    @Test
    public void testCreateRenterReview_Success() throws Exception {
        Principal mockPrincipal = Mockito.mock(Principal.class);
        Mockito.when(mockPrincipal.getName()).thenReturn("owner@gmail.com");

        RenterReviewRequest request = new RenterReviewRequest();
        request.setRating(5);
        request.setComment("Good renter");
        
        Mockito.doNothing().when(reviewService).createRenterReview(eq(1L), any(RenterReviewRequest.class), eq("owner@gmail.com"));

        mockMvc.perform(post("/api/v1/contracts/1/renter-review")
                .principal(mockPrincipal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Review submitted and pending approval"));
    }

    @Test
    public void testUpdateReview_Success() throws Exception {
        Principal mockPrincipal = Mockito.mock(Principal.class);
        Mockito.when(mockPrincipal.getName()).thenReturn("user@gmail.com");

        ReviewUpdateRequest request = new ReviewUpdateRequest();
        request.setRating(5);
        request.setComment("Updated");

        Mockito.doNothing().when(reviewService).updateReview(eq(1L), any(ReviewUpdateRequest.class), eq("user@gmail.com"));

        mockMvc.perform(patch("/api/v1/reviews/1")
                .principal(mockPrincipal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Review updated and is pending approval"));
    }
}
