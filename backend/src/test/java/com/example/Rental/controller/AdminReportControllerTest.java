package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.dto.request.ReportStatusUpdateRequest;
import com.example.Rental.entity.Report;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = AdminReportController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class AdminReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReportService reportService;

    @Test
    public void testGetAllReports_Success() throws Exception {
        Report report = new Report();
        report.setId(1L);
        report.setReason("Lừa đảo");
        report.setStatus(ReportStatus.PENDING);

        Page<Report> mockPage = new PageImpl<>(List.of(report));
        Mockito.when(reportService.getAllReports(eq(null), any())).thenReturn(mockPage);

        mockMvc.perform(get("/api/v1/admin/reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items[0].id").value(1))
                .andExpect(jsonPath("$.data.items[0].reason").value("Lừa đảo"));
    }

    @Test
    public void testGetReportById_Success() throws Exception {
        Report report = new Report();
        report.setId(1L);
        report.setReason("Lừa đảo");

        Mockito.when(reportService.getReportById(1L)).thenReturn(report);

        mockMvc.perform(get("/api/v1/admin/reports/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.reason").value("Lừa đảo"));
    }

    @Test
    public void testUpdateReportStatus_Success() throws Exception {
        Principal mockPrincipal = Mockito.mock(Principal.class);
        Mockito.when(mockPrincipal.getName()).thenReturn("admin@gmail.com");

        ReportStatusUpdateRequest request = new ReportStatusUpdateRequest();
        request.setStatus(ReportStatus.RESOLVED);

        Mockito.doNothing().when(reportService).updateReportStatus(eq(1L), any(ReportStatusUpdateRequest.class), eq("admin@gmail.com"));

        mockMvc.perform(patch("/api/v1/admin/reports/1/status")
                .principal(mockPrincipal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Report status updated successfully"));
    }
}
