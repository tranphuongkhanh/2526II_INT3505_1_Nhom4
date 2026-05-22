package com.example.Rental.controller;

import com.example.Rental.config.ApplicationConfig;
import com.example.Rental.config.JwtAuthFilter;
import com.example.Rental.config.SecurityConfig;
import com.example.Rental.dto.request.PostStatusUpdateRequest;
import com.example.Rental.dto.response.AdminPostResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.security.Principal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = AdminPostController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class},
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class, ApplicationConfig.class}
        )
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class AdminPostControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PostService postService;

    // 1. Test API Lấy danh sách bài đăng cho Admin
    @Test
    public void testGetAllPosts_Success() throws Exception {
        // Chuẩn bị Mock Data (Một Page chứa 1 bài đăng)
        AdminPostResponse mockPost = AdminPostResponse.builder()
                .id(1L)
                .roomTitle("Phòng trọ Admin Test")
                .ownerEmail("owner@test.com")
                .status(PostStatus.PENDING)
                .build();
        
        Page<AdminPostResponse> mockPage = new PageImpl<>(List.of(mockPost));

        // Dặn Mockito trả về mockPage khi được gọi với các tham số tương ứng
        Mockito.when(postService.getAdminPosts(null, 1, 20)).thenReturn(mockPage);

        // Gọi API GET và kiểm chứng
        mockMvc.perform(get("/api/v1/admin/posts")
                .param("page", "1")
                .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                // Chú ý: Vì trả về đối tượng Page của Spring, danh sách sẽ nằm trong mảng 'content'
                .andExpect(jsonPath("$.data.content[0].roomTitle").value("Phòng trọ Admin Test"))
                .andExpect(jsonPath("$.data.content[0].status").value("PENDING"));
    }

    // 2. Test API Duyệt bài đăng
    @Test
    public void testUpdatePostStatus_Approve_Success() throws Exception {
        // Chuẩn bị Mock Principal (Đại diện cho Admin đang đăng nhập)
        Principal mockPrincipal = Mockito.mock(Principal.class);
        String adminEmail = "admin_vip@rental.com";
        Mockito.when(mockPrincipal.getName()).thenReturn(adminEmail);

        Long postId = 10L;

        // Chuẩn bị Request Body gửi lên (Yêu cầu duyệt bài)
        PostStatusUpdateRequest request = new PostStatusUpdateRequest();
        request.setStatus(PostStatus.APPROVED);

        // Chuẩn bị kết quả trả về từ Service
        AdminPostResponse mockResponse = AdminPostResponse.builder()
                .id(postId)
                .status(PostStatus.APPROVED)
                .approvedByEmail(adminEmail)
                .build();

        // Dặn Mockito xử lý hàm updatePostStatus
        Mockito.when(postService.updatePostStatus(eq(postId), any(PostStatusUpdateRequest.class), eq(adminEmail)))
               .thenReturn(mockResponse);

        // Gọi API PUT và kiểm chứng
        mockMvc.perform(put("/api/v1/admin/posts/" + postId + "/status")
                .principal(mockPrincipal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.approvedByEmail").value(adminEmail));
    }
}