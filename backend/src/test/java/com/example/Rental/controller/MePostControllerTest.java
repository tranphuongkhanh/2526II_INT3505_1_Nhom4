package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.dto.response.OwnerPostResponse;
import com.example.Rental.enums.PostStatus;
import com.example.Rental.service.PostService;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Vẫn áp dụng "bài cũ": Tắt toàn bộ Security tự động để test không bị sập
@WebMvcTest(
    controllers = MePostController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class MePostControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PostService postService;

    @Test
    public void testGetMyPosts_Success() throws Exception {
        // 1. CHÌA KHÓA Ở ĐÂY: Làm giả đối tượng Principal
        Principal mockPrincipal = Mockito.mock(Principal.class);
        String mockEmail = "chuphong_test@gmail.com";
        Mockito.when(mockPrincipal.getName()).thenReturn(mockEmail);

        // 2. Chuẩn bị dữ liệu giả mạo từ Service
        OwnerPostResponse mockPost = OwnerPostResponse.builder()
                .id(100L)
                .roomTitle("Phòng trọ cao cấp Cầu Giấy")
                .status(PostStatus.APPROVED)
                .build();
        
        // Khi Service được gọi với email giả, sẽ trả về list bài đăng giả
        Mockito.when(postService.getMyPosts(mockEmail)).thenReturn(List.of(mockPost));

        // 3. Thực hiện gọi API (Gắn kèm principal giả vào request)
        mockMvc.perform(get("/api/v1/me/posts").principal(mockPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].roomTitle").value("Phòng trọ cao cấp Cầu Giấy"))
                .andExpect(jsonPath("$.data[0].status").value("APPROVED"));
    }
}