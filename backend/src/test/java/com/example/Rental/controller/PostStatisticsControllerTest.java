package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.dto.response.PostStatisticsResponse;
import com.example.Rental.service.PostStatisticsService;
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

import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = PostStatisticsController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class PostStatisticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PostStatisticsService postStatisticsService;

    @Test
    public void testGetPostStatistics_Success() throws Exception {
        Principal principal = Mockito.mock(Principal.class);
        Mockito.when(principal.getName()).thenReturn("user@gmail.com");

        PostStatisticsResponse stats = new PostStatisticsResponse();
        stats.setPostId(1L);
        stats.setTotalViews(100L);
        stats.setFavoriteCount(50L);

        Mockito.when(postStatisticsService.getPostStatistics(eq(1L), eq("user@gmail.com"))).thenReturn(stats);

        mockMvc.perform(get("/api/v1/me/posts/1/statistics")
                .principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.postId").value(1))
                .andExpect(jsonPath("$.data.totalViews").value(100))
                .andExpect(jsonPath("$.data.favoriteCount").value(50));
    }
}
