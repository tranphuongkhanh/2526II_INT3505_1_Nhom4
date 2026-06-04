package com.example.Rental.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.example.Rental.dto.request.ReportRequest;
import com.example.Rental.dto.request.ReportStatusUpdateRequest;
import com.example.Rental.entity.Post;
import com.example.Rental.entity.Report;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.enums.NotificationType;
import com.example.Rental.enums.PostStatus;
import com.example.Rental.enums.ReportStatus;
import com.example.Rental.enums.UserStatus;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.PostRepository;
import com.example.Rental.repository.ReportRepository;
import com.example.Rental.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
public class ReportServiceTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ReportService reportService;

    private User user;
    private User admin;
    private Post post;
    private Report report;
    private String email = "user@example.com";
    private String adminEmail = "admin@example.com";

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail(email);
        user.setStatus(UserStatus.ACTIVE);

        admin = new User();
        admin.setId(2L);
        admin.setEmail(adminEmail);
        admin.setStatus(UserStatus.ACTIVE);

        Room room = new Room();
        room.setId(1L);
        room.setTitle("Beautiful Room");

        post = new Post();
        post.setId(1L);
        post.setCreatedBy(user);
        post.setRoom(room);
        post.setStatus(PostStatus.APPROVED);

        report = new Report();
        report.setId(1L);
        report.setPost(post);
        report.setReporter(user);
        report.setStatus(ReportStatus.PENDING);
    }

    @Test
    void createReport_Success() {
        ReportRequest request = new ReportRequest();
        request.setReason("Inappropriate content");

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(postRepository.findById(post.getId())).thenReturn(Optional.of(post));
        when(reportRepository.existsByReporterIdAndPostIdAndStatus(user.getId(), post.getId(), ReportStatus.PENDING)).thenReturn(false);

        reportService.createReport(post.getId(), request, email);

        verify(reportRepository).save(any(Report.class));
    }

    @Test
    void createReport_UserNotActive() {
        user.setStatus(UserStatus.BANNED);
        ReportRequest request = new ReportRequest();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> reportService.createReport(post.getId(), request, email));
        assertEquals("User account is not active", exception.getMessage());
    }

    @Test
    void createReport_AlreadyReported() {
        ReportRequest request = new ReportRequest();
        
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(postRepository.findById(post.getId())).thenReturn(Optional.of(post));
        when(reportRepository.existsByReporterIdAndPostIdAndStatus(user.getId(), post.getId(), ReportStatus.PENDING)).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> reportService.createReport(post.getId(), request, email));
        assertEquals("You have already reported this post. Please wait for an admin to review.", exception.getMessage());
    }

    @Test
    void getUserReports_Success() {
        Page<Report> page = new PageImpl<>(List.of(report));
        Pageable pageable = PageRequest.of(0, 10);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(reportRepository.findByReporterId(user.getId(), pageable)).thenReturn(page);

        Page<Report> result = reportService.getUserReports(email, pageable);

        assertEquals(1, result.getContent().size());
        assertEquals(1L, result.getContent().get(0).getId());
    }

    @Test
    void getReportById_Success() {
        when(reportRepository.findById(1L)).thenReturn(Optional.of(report));

        Report result = reportService.getReportById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void updateReportStatus_Resolved() {
        ReportStatusUpdateRequest request = new ReportStatusUpdateRequest();
        request.setStatus(ReportStatus.RESOLVED);
        request.setResolution("Post removed due to violation");

        when(userRepository.findByEmail(adminEmail)).thenReturn(Optional.of(admin));
        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));

        reportService.updateReportStatus(report.getId(), request, adminEmail);

        assertEquals(ReportStatus.RESOLVED, report.getStatus());
        assertEquals(admin, report.getHandledBy());
        assertEquals(PostStatus.DELETED, post.getStatus());
        verify(reportRepository).save(report);
        verify(postRepository).save(post);
        verify(notificationService, times(2)).createAndSendNotification(any(), any(), any(), any(), any(), any());
    }

    @Test
    void updateReportStatus_AlreadyResolved() {
        report.setStatus(ReportStatus.RESOLVED);
        ReportStatusUpdateRequest request = new ReportStatusUpdateRequest();

        when(userRepository.findByEmail(adminEmail)).thenReturn(Optional.of(admin));
        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> reportService.updateReportStatus(report.getId(), request, adminEmail));
        assertEquals("Report is already resolved or rejected", exception.getMessage());
    }
}
