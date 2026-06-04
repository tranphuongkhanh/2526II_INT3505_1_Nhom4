package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.dto.request.ReportRequest;
import com.example.Rental.entity.Post;
import com.example.Rental.entity.Report;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.enums.ReportStatus;
import com.example.Rental.service.ReportService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = ReportController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReportService reportService;

    @Test
    public void testCreateReport_Success() throws Exception {
        Principal mockPrincipal = Mockito.mock(Principal.class);
        Mockito.when(mockPrincipal.getName()).thenReturn("user@gmail.com");

        Long postId = 1L;
        ReportRequest request = new ReportRequest();
        request.setReason("Lừa đảo");

        Mockito.doNothing().when(reportService).createReport(eq(postId), any(ReportRequest.class), eq("user@gmail.com"));

        mockMvc.perform(post("/api/v1/posts/" + postId + "/reports")
                .principal(mockPrincipal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Report submitted successfully"));
    }

    @Test
    public void testGetUserReports_Success() throws Exception {
        Principal mockPrincipal = Mockito.mock(Principal.class);
        Mockito.when(mockPrincipal.getName()).thenReturn("user@gmail.com");

        User reporter = new User();
        reporter.setId(1L);

        Room room = new Room();
        room.setId(1L);
        room.setTitle("Phòng lừa đảo");

        Post post = new Post();
        post.setId(1L);
        post.setRoom(room);

        Report report = new Report();
        report.setId(1L);
        report.setPost(post);
        report.setReporter(reporter);
        report.setReason("Lừa đảo");
        report.setStatus(ReportStatus.PENDING);

        Page<Report> mockPage = new PageImpl<>(List.of(report));
        Mockito.when(reportService.getUserReports(eq("user@gmail.com"), any())).thenReturn(mockPage);

        mockMvc.perform(get("/api/v1/users/me/reports").principal(mockPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User reports retrieved"))
                .andExpect(jsonPath("$.data.items[0].id").value(1))
                .andExpect(jsonPath("$.data.items[0].reason").value("Lừa đảo"))
                .andExpect(jsonPath("$.data.items[0].status").value("PENDING"));
    }
}
