package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.enums.PostStatus;
import com.example.Rental.enums.UserRole;
import com.example.Rental.repository.PostRepository;
import com.example.Rental.repository.RoomRepository;
import com.example.Rental.repository.UserRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = PublicStatisticsController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class PublicStatisticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoomRepository roomRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PostRepository postRepository;

    @Test
    public void testGetStatistics_Success() throws Exception {
        Mockito.when(roomRepository.countByDeletedAtIsNull()).thenReturn(100L);
        Mockito.when(userRepository.countByRole(UserRole.OWNER)).thenReturn(20L);
        Mockito.when(userRepository.countByRole(UserRole.RENTER)).thenReturn(80L);
        Mockito.when(postRepository.countByStatus(PostStatus.APPROVED)).thenReturn(50L);

        mockMvc.perform(get("/api/v1/public/statistics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalRooms").value(100))
                .andExpect(jsonPath("$.data.totalOwners").value(20))
                .andExpect(jsonPath("$.data.totalRenters").value(80))
                .andExpect(jsonPath("$.data.totalActivePosts").value(50));
    }
}
