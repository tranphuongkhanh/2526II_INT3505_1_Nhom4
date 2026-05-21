package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.dto.request.CreatePostRequest;
import com.example.Rental.dto.request.ExtendPostRequest;
import com.example.Rental.dto.response.OwnerPostResponse;
import com.example.Rental.entity.Payment;
import com.example.Rental.enums.DurationType;
import com.example.Rental.enums.PaymentStatus;
import com.example.Rental.enums.PostStatus;
import com.example.Rental.service.PostService;
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

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;

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

    @Autowired
    private ObjectMapper objectMapper; // Công cụ chuyển Object thành JSON

    @MockBean
    private PostService postService;

    // 1. Test API Lấy danh sách bài đăng (Cũ)
    @Test
    public void testGetMyPosts_Success() throws Exception {
        Principal mockPrincipal = Mockito.mock(Principal.class);
        String mockEmail = "owner@gmail.com";
        Mockito.when(mockPrincipal.getName()).thenReturn(mockEmail);

        OwnerPostResponse mockPost = OwnerPostResponse.builder()
                .id(100L)
                .roomTitle("Phòng trọ cao cấp Cầu Giấy")
                .status(PostStatus.APPROVED)
                .build();
        
        Mockito.when(postService.getMyPosts(mockEmail)).thenReturn(List.of(mockPost));

        mockMvc.perform(get("/api/v1/me/posts").principal(mockPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].roomTitle").value("Phòng trọ cao cấp Cầu Giấy"))
                .andExpect(jsonPath("$.data[0].status").value("APPROVED"));
    }

    // 2. Test API Tạo bài đăng mới (Mới)
    @Test
    public void testCreatePost_Success() throws Exception {
        // Chuẩn bị mock Principal
        Principal mockPrincipal = Mockito.mock(Principal.class);
        String mockEmail = "owner@gmail.com";
        Mockito.when(mockPrincipal.getName()).thenReturn(mockEmail);

        // Chuẩn bị Request Body
        CreatePostRequest request = new CreatePostRequest();
        request.setRoomId(1L);
        request.setDurationType(DurationType.MONTH);
        request.setDurationValue(3);

        // Chuẩn bị Mock Payment trả về từ Service
        Payment mockPayment = Payment.builder()
                .id(999L)
                .amount(BigDecimal.valueOf(600000))
                .status(PaymentStatus.PENDING)
                .note("Thanh toán tạo bài đăng mới")
                .build();

        // Dặn Mockito: Khi service.createPost được gọi với bất kỳ request nào, hãy trả về mockPayment
        Mockito.when(postService.createPost(eq(mockEmail), any(CreatePostRequest.class)))
               .thenReturn(mockPayment);

        // Thực hiện POST request và kiểm tra
        mockMvc.perform(post("/api/v1/me/posts")
                .principal(mockPrincipal)
                .contentType(MediaType.APPLICATION_JSON) // Khai báo gửi dạng JSON
                .content(objectMapper.writeValueAsString(request))) // Chuyển request thành chuỗi JSON
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(999))
                .andExpect(jsonPath("$.data.amount").value(600000))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    // 3. Test API Gia hạn bài đăng (Mới)
    @Test
    public void testExtendPost_Success() throws Exception {
        // Chuẩn bị mock Principal
        Principal mockPrincipal = Mockito.mock(Principal.class);
        String mockEmail = "owner@gmail.com";
        Mockito.when(mockPrincipal.getName()).thenReturn(mockEmail);

        Long postId = 5L;

        // Chuẩn bị Request Body
        ExtendPostRequest request = new ExtendPostRequest();
        request.setDurationType(DurationType.WEEK);
        request.setDurationValue(2);

        // Chuẩn bị Mock Payment trả về
        Payment mockPayment = Payment.builder()
                .id(888L)
                .amount(BigDecimal.valueOf(100000))
                .status(PaymentStatus.PENDING)
                .note("Thanh toán gia hạn bài đăng ID: 5")
                .build();

        // Dặn Mockito
        Mockito.when(postService.extendPost(eq(mockEmail), eq(postId), any(ExtendPostRequest.class)))
               .thenReturn(mockPayment);

        // Thực hiện POST request và kiểm tra
        mockMvc.perform(post("/api/v1/me/posts/" + postId + "/extend")
                .principal(mockPrincipal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(888))
                .andExpect(jsonPath("$.data.amount").value(100000));
    }

    @Test
    public void testDeletePost_Success() throws Exception {
        // 1. Chuẩn bị mock Principal
        Principal mockPrincipal = Mockito.mock(Principal.class);
        String mockEmail = "owner@gmail.com";
        Mockito.when(mockPrincipal.getName()).thenReturn(mockEmail);

        Long postId = 1L;

        // 2. Dặn Mockito: Khi hàm deletePost được gọi thì không làm gì cả (vì hàm này kiểu void)
        Mockito.doNothing().when(postService).deletePost(mockEmail, postId);

        // 3. Thực hiện gọi API DELETE và kiểm tra
        mockMvc.perform(delete("/api/v1/me/posts/" + postId)
                .principal(mockPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Xóa (ẩn) bài đăng thành công"));
    }
}