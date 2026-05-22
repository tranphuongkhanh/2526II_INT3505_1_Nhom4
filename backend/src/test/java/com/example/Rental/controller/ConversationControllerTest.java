package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.dto.request.CreateConversationRequest;
import com.example.Rental.dto.response.ConversationResponse;
import com.example.Rental.service.ConversationService;
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

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = ConversationController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class ConversationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ConversationService conversationService;

    // 1. Test API lấy danh sách hội thoại
    @Test
    public void testGetMyConversations_Success() throws Exception {
        Principal mockPrincipal = Mockito.mock(Principal.class);
        String mockEmail = "user@test.com";
        Mockito.when(mockPrincipal.getName()).thenReturn(mockEmail);

        ConversationResponse mockConv = ConversationResponse.builder()
                .id(1L)
                .partnerId(2L)
                .partnerName("Nguyễn Văn A")
                .lastMessagePreview("Xin chào, phòng còn không ạ?")
                .build();

        Mockito.when(conversationService.getUserConversations(mockEmail)).thenReturn(List.of(mockConv));

        mockMvc.perform(get("/api/v1/conversations").principal(mockPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].partnerName").value("Nguyễn Văn A"))
                .andExpect(jsonPath("$.data[0].lastMessagePreview").value("Xin chào, phòng còn không ạ?"));
    }

    // 2. Test API Tạo hoặc lấy hội thoại
    @Test
    public void testGetOrCreateConversation_Success() throws Exception {
        Principal mockPrincipal = Mockito.mock(Principal.class);
        String mockEmail = "user@test.com";
        Mockito.when(mockPrincipal.getName()).thenReturn(mockEmail);

        CreateConversationRequest request = new CreateConversationRequest();
        request.setPartnerId(3L);

        ConversationResponse mockResponse = ConversationResponse.builder()
                .id(10L)
                .partnerId(3L)
                .partnerName("Trần Thị B")
                .build();

        Mockito.when(conversationService.getOrCreateConversation(eq(mockEmail), any(CreateConversationRequest.class)))
               .thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/conversations")
                .principal(mockPrincipal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.partnerName").value("Trần Thị B"));
    }

    // 3. Test API Chi tiết hội thoại
    @Test
    public void testGetConversationDetail_Success() throws Exception {
        Principal mockPrincipal = Mockito.mock(Principal.class);
        String mockEmail = "user@test.com";
        Mockito.when(mockPrincipal.getName()).thenReturn(mockEmail);

        Long convId = 15L;

        ConversationResponse mockResponse = ConversationResponse.builder()
                .id(convId)
                .partnerId(5L)
                .partnerName("Lê Văn C")
                .build();

        Mockito.when(conversationService.getConversationDetail(mockEmail, convId)).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/conversations/" + convId)
                .principal(mockPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(15))
                .andExpect(jsonPath("$.data.partnerName").value("Lê Văn C"));
    }
}