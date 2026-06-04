package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.entity.RoomImage;
import com.example.Rental.entity.User;
import com.example.Rental.repository.UserRepository;
import com.example.Rental.service.RoomImageService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.security.Principal;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = RoomImageController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class RoomImageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoomImageService roomImageService;

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
    public void testUploadRoomImage_Success() throws Exception {
        Principal principal = mockPrincipal(1L, "owner@gmail.com");

        MockMultipartFile file = new MockMultipartFile("image", "image.jpg", "image/jpeg", "image data".getBytes());

        RoomImage image = new RoomImage();
        image.setId(1L);
        image.setImageUrl("http://cloudinary/image.jpg");
        image.setIsThumbnail(false);
        image.setDisplayOrder(1);

        Mockito.when(roomImageService.uploadImage(eq(1L), eq(1L), any())).thenReturn(image);

        mockMvc.perform(multipart("/api/v1/rooms/1/images")
                .file(file)
                .principal(principal))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.imageUrl").value("http://cloudinary/image.jpg"));
    }

    @Test
    public void testDeleteRoomImage_Success() throws Exception {
        Principal principal = mockPrincipal(1L, "owner@gmail.com");

        Mockito.doNothing().when(roomImageService).deleteImage(eq(1L), eq(1L), eq(1L));

        mockMvc.perform(delete("/api/v1/rooms/1/images/1")
                .principal(principal))
                .andExpect(status().isNoContent());
    }

    @Test
    public void testSetThumbnail_Success() throws Exception {
        Principal principal = mockPrincipal(1L, "owner@gmail.com");

        RoomImage image = new RoomImage();
        image.setId(1L);
        image.setImageUrl("http://cloudinary/image.jpg");
        image.setIsThumbnail(true);
        image.setDisplayOrder(1);

        Mockito.when(roomImageService.setThumbnail(eq(1L), eq(1L), eq(1L))).thenReturn(image);

        mockMvc.perform(patch("/api/v1/rooms/1/images/1/thumbnail")
                .principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.thumbnail").value(true));
    }
}
