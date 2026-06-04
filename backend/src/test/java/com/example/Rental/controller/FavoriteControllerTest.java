package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.dto.response.CursorPageResponse;
import com.example.Rental.entity.Post;
import com.example.Rental.entity.Room;
import com.example.Rental.service.FavoriteService;
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
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = FavoriteController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class FavoriteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FavoriteService favoriteService;

    @Test
    public void testAddFavorite_Success() throws Exception {
        Principal mockPrincipal = Mockito.mock(Principal.class);
        Mockito.when(mockPrincipal.getName()).thenReturn("user@gmail.com");

        Long postId = 1L;
        Mockito.doNothing().when(favoriteService).addFavorite("user@gmail.com", postId);

        mockMvc.perform(post("/api/v1/posts/" + postId + "/favorites").principal(mockPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Favorite added"));
    }

    @Test
    public void testRemoveFavorite_Success() throws Exception {
        Principal mockPrincipal = Mockito.mock(Principal.class);
        Mockito.when(mockPrincipal.getName()).thenReturn("user@gmail.com");

        Long postId = 1L;
        Mockito.doNothing().when(favoriteService).removeFavorite("user@gmail.com", postId);

        mockMvc.perform(delete("/api/v1/posts/" + postId + "/favorites").principal(mockPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Favorite removed"));
    }

    @Test
    public void testGetUserFavorites_Success() throws Exception {
        Principal mockPrincipal = Mockito.mock(Principal.class);
        Mockito.when(mockPrincipal.getName()).thenReturn("user@gmail.com");

        Room room = new Room();
        room.setId(1L);
        room.setTitle("Phòng đẹp");
        room.setPrice(BigDecimal.valueOf(1500000));
        room.setAreaMq(20.0);
        room.setCity("Hà Nội");

        Post post = new Post();
        post.setId(1L);
        post.setRoom(room);
        post.setViewCount(100);
        post.setCreatedAt(LocalDateTime.now());

        Page<Post> mockPage = new PageImpl<>(List.of(post));
        Mockito.when(favoriteService.getUserFavorites(eq("user@gmail.com"), any())).thenReturn(mockPage);

        mockMvc.perform(get("/api/v1/users/me/favorites").principal(mockPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Favorites retrieved"))
                .andExpect(jsonPath("$.data.items[0].id").value(1))
                .andExpect(jsonPath("$.data.items[0].roomTitle").value("Phòng đẹp"));
    }

    @Test
    public void testGetUserFavoritesCursor_Success() throws Exception {
        Principal mockPrincipal = Mockito.mock(Principal.class);
        Mockito.when(mockPrincipal.getName()).thenReturn("user@gmail.com");

        Room room = new Room();
        room.setId(1L);
        room.setTitle("Phòng trọ sinh viên");
        room.setPrice(BigDecimal.valueOf(1000000));
        room.setAreaMq(15.0);

        Post post = new Post();
        post.setId(1L);
        post.setRoom(room);
        post.setViewCount(50);

        CursorPageResponse<Post> mockCursorPage = new CursorPageResponse<>(List.of(post), null);
        Mockito.when(favoriteService.getUserFavoritesCursor(eq("user@gmail.com"), any(), eq(10))).thenReturn(mockCursorPage);

        mockMvc.perform(get("/api/v1/users/me/favorites/cursor")
                        .param("limit", "10")
                        .principal(mockPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Favorites retrieved"))
                .andExpect(jsonPath("$.data.items[0].id").value(1))
                .andExpect(jsonPath("$.data.items[0].roomTitle").value("Phòng trọ sinh viên"));
    }
}
