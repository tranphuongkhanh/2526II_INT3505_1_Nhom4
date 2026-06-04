package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.dto.request.UpdateProfileRequest;
import com.example.Rental.dto.request.UserStatusUpdateRequest;
import com.example.Rental.dto.response.RenterLookupResponse;
import com.example.Rental.dto.response.UserListResponse;
import com.example.Rental.dto.response.UserResponse;
import com.example.Rental.enums.UserStatus;
import com.example.Rental.service.UserService;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collection;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = UserController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    private Authentication mockAuthentication(String role) {
        Authentication authentication = Mockito.mock(Authentication.class);
        Collection authorities = List.of(new SimpleGrantedAuthority(role));
        Mockito.doReturn(authorities).when(authentication).getAuthorities();
        return authentication;
    }

    @Test
    public void testSearchRenters_Admin_Success() throws Exception {
        Authentication auth = mockAuthentication("ROLE_ADMIN");
        UserResponse userResponse = UserResponse.builder().id(1L).email("renter@gmail.com").build();
        
        Mockito.when(userService.searchRenters(eq("renter"))).thenReturn(List.of(userResponse));

        mockMvc.perform(get("/api/v1/users/search")
                .param("q", "renter")
                .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(1));
    }

    @Test
    public void testLookupRenterByEmail_Owner_Success() throws Exception {
        Authentication auth = mockAuthentication("ROLE_OWNER");
        RenterLookupResponse response = RenterLookupResponse.builder().id(1L).maskedEmail("r***@gmail.com").build();
        
        Mockito.when(userService.findRenterByEmail(eq("renter@gmail.com"))).thenReturn(response);

        mockMvc.perform(get("/api/v1/users/lookup-renter")
                .param("email", "renter@gmail.com")
                .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.maskedEmail").value("r***@gmail.com"));
    }

    @Test
    public void testGetProfile_Success() throws Exception {
        UserResponse response = UserResponse.builder().id(1L).email("user@gmail.com").build();
        Mockito.when(userService.getProfile()).thenReturn(response);

        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    public void testUpdateProfile_Success() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("Updated Name");

        UserResponse response = UserResponse.builder().id(1L).fullName("Updated Name").build();
        Mockito.when(userService.updateProfile(any(UpdateProfileRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/users/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Updated Name"));
    }

    @Test
    public void testUploadAvatar_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile("avatar", "avatar.jpg", "image/jpeg", "image data".getBytes());

        UserResponse response = UserResponse.builder().id(1L).avatarUrl("http://cloudinary/avatar.jpg").build();
        Mockito.when(userService.uploadAvatar(any())).thenReturn(response);

        mockMvc.perform(multipart("/api/v1/users/me/avatar").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.avatarUrl").value("http://cloudinary/avatar.jpg"));
    }

    @Test
    public void testListUsers_Admin_Success() throws Exception {
        Authentication auth = mockAuthentication("ROLE_ADMIN");
        
        UserResponse userResponse = UserResponse.builder().id(1L).build();
        UserListResponse response = UserListResponse.builder().items(List.of(userResponse)).build();
        
        Mockito.when(userService.listUsers(any(), any(), eq(1), eq(10))).thenReturn(response);

        mockMvc.perform(get("/api/v1/users")
                .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items[0].id").value(1));
    }

    @Test
    public void testUpdateUserStatus_Admin_Success() throws Exception {
        Authentication auth = mockAuthentication("ROLE_ADMIN");
        
        UserStatusUpdateRequest request = new UserStatusUpdateRequest();
        request.setStatus(UserStatus.ACTIVE);

        UserResponse response = UserResponse.builder().id(1L).status(UserStatus.ACTIVE.name()).build();
        Mockito.when(userService.updateUserStatus(eq(1L), eq(UserStatus.ACTIVE))).thenReturn(response);

        mockMvc.perform(patch("/api/v1/users/1/status")
                .principal(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }
}
