package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.dto.response.CursorPageResponse;
import com.example.Rental.dto.response.NotificationResponse;
import com.example.Rental.entity.User;
import com.example.Rental.repository.UserRepository;
import com.example.Rental.service.NotificationService;
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
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = NotificationController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private UserRepository userRepository;

    private Principal mockPrincipal(Long userId, String email) {
        Principal principal = Mockito.mock(Principal.class);
        Mockito.when(principal.getName()).thenReturn(email);

        User user = new User();
        user.setId(userId);
        user.setEmail(email);
        Mockito.when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        return principal;
    }

    @Test
    public void testGetNotifications_Success() throws Exception {
        Principal principal = mockPrincipal(1L, "user@gmail.com");

        NotificationResponse notification = new NotificationResponse();
        notification.setId(1L);
        notification.setContent("Test Message");

        CursorPageResponse<NotificationResponse> response = new CursorPageResponse<>(List.of(notification), null);

        Mockito.when(notificationService.getUserNotifications(eq(1L), any(), eq(20), any())).thenReturn(response);

        mockMvc.perform(get("/api/v1/notifications")
                .principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(1))
                .andExpect(jsonPath("$.items[0].content").value("Test Message"));
    }

    @Test
    public void testGetUnreadCount_Success() throws Exception {
        Principal principal = mockPrincipal(1L, "user@gmail.com");

        Mockito.when(notificationService.getUnreadCount(eq(1L))).thenReturn(5L);

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                .principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(5));
    }

    @Test
    public void testMarkAsRead_Success() throws Exception {
        Principal principal = mockPrincipal(1L, "user@gmail.com");

        NotificationResponse response = new NotificationResponse();
        response.setId(1L);
        response.setIsRead(true);

        Mockito.when(notificationService.markAsRead(eq(1L), eq(1L))).thenReturn(response);

        mockMvc.perform(patch("/api/v1/notifications/1/read")
                .principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.isRead").value(true));
    }

    @Test
    public void testMarkAllAsRead_Success() throws Exception {
        Principal principal = mockPrincipal(1L, "user@gmail.com");

        Mockito.doNothing().when(notificationService).markAllAsRead(eq(1L));

        mockMvc.perform(patch("/api/v1/notifications/read-all")
                .principal(principal))
                .andExpect(status().isNoContent());
    }

    @Test
    public void testDeleteNotification_Success() throws Exception {
        Principal principal = mockPrincipal(1L, "user@gmail.com");

        Mockito.doNothing().when(notificationService).deleteNotification(eq(1L), eq(1L));

        mockMvc.perform(delete("/api/v1/notifications/1")
                .principal(principal))
                .andExpect(status().isNoContent());
    }
}
