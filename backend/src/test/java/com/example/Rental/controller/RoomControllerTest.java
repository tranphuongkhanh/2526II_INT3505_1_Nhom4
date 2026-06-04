package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.dto.request.RoomFilterRequest;
import com.example.Rental.dto.request.RoomRequest;
import com.example.Rental.dto.request.RoomStatusUpdateRequest;
import com.example.Rental.dto.response.RoomResponse;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.enums.RentalStatus;
import com.example.Rental.repository.UserRepository;
import com.example.Rental.service.RoomService;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = RoomController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class RoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RoomService roomService;

    @MockBean
    private UserRepository userRepository;

    private Principal mockPrincipal(Long ownerId, String email) {
        Principal principal = Mockito.mock(Principal.class);
        Mockito.when(principal.getName()).thenReturn(email);

        User user = new User();
        user.setId(ownerId);
        user.setEmail(email);
        Mockito.when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        return principal;
    }

    @Test
    public void testGetAllRooms_Success() throws Exception {
        Principal principal = mockPrincipal(1L, "owner@gmail.com");

        RoomResponse roomResponse = new RoomResponse();
        roomResponse.setId(1L);
        roomResponse.setTitle("Test Room");

        Page<RoomResponse> page = new PageImpl<>(List.of(roomResponse));
        Mockito.when(roomService.getAllRoomsByOwner(eq(1L), any(), eq(1), eq(10))).thenReturn(page);

        mockMvc.perform(get("/api/v1/rooms")
                .principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(1))
                .andExpect(jsonPath("$.data.content[0].title").value("Test Room"));
    }

    @Test
    public void testCreateRoom_Success() throws Exception {
        Principal principal = mockPrincipal(1L, "owner@gmail.com");

        RoomRequest request = new RoomRequest();
        request.setTitle("New Room");

        Room room = new Room();
        room.setId(1L);
        room.setTitle("New Room");
        
        Mockito.when(roomService.createRoom(eq(1L), any(RoomRequest.class))).thenReturn(room);

        mockMvc.perform(post("/api/v1/rooms")
                .principal(principal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("New Room"));
    }

    @Test
    public void testGetRoomDetail_Success() throws Exception {
        Principal principal = mockPrincipal(1L, "owner@gmail.com");

        RoomResponse response = new RoomResponse();
        response.setId(1L);
        response.setTitle("Test Room");

        Mockito.when(roomService.getRoomDetail(eq(1L), eq(1L))).thenReturn(response);

        mockMvc.perform(get("/api/v1/rooms/1")
                .principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Test Room"));
    }

    @Test
    public void testUpdateRoom_Success() throws Exception {
        Principal principal = mockPrincipal(1L, "owner@gmail.com");

        RoomRequest request = new RoomRequest();
        request.setTitle("Updated Room");

        RoomResponse response = new RoomResponse();
        response.setId(1L);
        response.setTitle("Updated Room");

        Mockito.when(roomService.updateRoom(eq(1L), eq(1L), any(RoomRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/rooms/1")
                .principal(principal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Updated Room"));
    }

    @Test
    public void testDeleteRoom_Success() throws Exception {
        Principal principal = mockPrincipal(1L, "owner@gmail.com");

        Mockito.doNothing().when(roomService).deleteRoom(eq(1L), eq(1L));

        mockMvc.perform(delete("/api/v1/rooms/1")
                .principal(principal))
                .andExpect(status().isNoContent());
    }

    @Test
    public void testUpdateRentalStatus_Success() throws Exception {
        Principal principal = mockPrincipal(1L, "owner@gmail.com");

        RoomStatusUpdateRequest request = new RoomStatusUpdateRequest();
        request.setStatus(RentalStatus.RENTED);

        RoomResponse response = new RoomResponse();
        response.setId(1L);
        response.setRentalStatus(RentalStatus.RENTED);

        Mockito.when(roomService.updateRentalStatus(eq(1L), eq(1L), eq(RentalStatus.RENTED))).thenReturn(response);

        mockMvc.perform(patch("/api/v1/rooms/1/rental-status")
                .principal(principal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.rentalStatus").value("RENTED"));
    }
}
