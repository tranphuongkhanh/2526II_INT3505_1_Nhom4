package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.dto.request.VehicleRequest;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.entity.Vehicle;
import com.example.Rental.service.VehicleService;
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
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = VehicleController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class VehicleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VehicleService vehicleService;

    @Test
    public void testListByRoom_Success() throws Exception {
        Room room = new Room();
        room.setId(1L);

        User renter = new User();
        renter.setId(1L);

        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);
        vehicle.setRoom(room);
        vehicle.setRenter(renter);
        vehicle.setLicensePlate("29A-12345");
        vehicle.setVehicleType("Motorbike");

        Mockito.when(vehicleService.listByRoom(1L)).thenReturn(List.of(vehicle));

        mockMvc.perform(get("/api/v1/rooms/1/vehicles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(1))
                .andExpect(jsonPath("$.data[0].licensePlate").value("29A-12345"));
    }

    @Test
    public void testRegister_Success() throws Exception {
        VehicleRequest request = new VehicleRequest();
        request.setLicensePlate("29A-12345");
        request.setVehicleType("Motorbike");
        request.setRenterId(1L);

        Room room = new Room();
        room.setId(1L);

        User renter = new User();
        renter.setId(1L);

        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);
        vehicle.setRoom(room);
        vehicle.setRenter(renter);
        vehicle.setLicensePlate("29A-12345");
        vehicle.setVehicleType("Motorbike");

        Mockito.when(vehicleService.register(eq(1L), any(Vehicle.class), eq(1L))).thenReturn(vehicle);

        mockMvc.perform(post("/api/v1/rooms/1/vehicles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.licensePlate").value("29A-12345"));
    }

    @Test
    public void testDelete_Success() throws Exception {
        Mockito.doNothing().when(vehicleService).delete(1L);

        mockMvc.perform(delete("/api/v1/vehicles/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Vehicle deleted"));
    }
}
