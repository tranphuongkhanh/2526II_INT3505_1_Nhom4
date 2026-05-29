package com.example.Rental.service;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Rental.dto.request.ReportRequest;
import com.example.Rental.dto.request.ReportStatusUpdateRequest;
import com.example.Rental.entity.Post;
import com.example.Rental.entity.Report;
import com.example.Rental.entity.User;
import com.example.Rental.enums.NotificationType;
import com.example.Rental.enums.PostStatus;
import com.example.Rental.enums.ReportStatus;
import com.example.Rental.enums.UserStatus;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.PostRepository;
import com.example.Rental.repository.ReportRepository;
import com.example.Rental.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public void createReport(Long postId, ReportRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("User account is not active");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found"));

        if (reportRepository.existsByReporterIdAndPostIdAndStatus(user.getId(), post.getId(), ReportStatus.PENDING)) {
            throw new RuntimeException("You have already reported this post. Please wait for an admin to review.");
        }

        Report report = Report.builder()
                .post(post)
                .reporter(user)
                .reason(request.getReason())
                .status(ReportStatus.PENDING)
                .build();

        reportRepository.save(report);
    }

    @Transactional(readOnly = true)
    public Page<Report> getUserReports(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        return reportRepository.findByReporterId(user.getId(), pageable);
    }

    @Transactional(readOnly = true)
    public Page<Report> getAllReports(ReportStatus status, Pageable pageable) {
        if (status != null) {
            return reportRepository.findByStatus(status, pageable);
        }
        return reportRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Report getReportById(Long reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Report not found"));
    }

    @Transactional
    public void updateReportStatus(Long reportId, ReportStatusUpdateRequest request, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new EntityNotFoundException("Admin not found"));

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Report not found"));

        if (report.getStatus() != ReportStatus.PENDING) {
            throw new RuntimeException("Report is already resolved or rejected");
        }

        report.setStatus(request.getStatus());
        report.setResolution(request.getResolution());
        report.setHandledBy(admin);
        report.setHandledAt(LocalDateTime.now());

        reportRepository.save(report);

        // Khi admin duyệt báo cáo (RESOLVED): gỡ bài đăng bị báo cáo và thông báo
        if (request.getStatus() == ReportStatus.RESOLVED) {
            Post post = report.getPost();
            String roomTitle = post.getRoom().getTitle();

            if (post.getStatus() != PostStatus.DELETED) {
                post.setStatus(PostStatus.DELETED);
                post.setEndDate(LocalDateTime.now());
                postRepository.save(post);

                notificationService.createAndSendNotification(
                        post.getCreatedBy(),
                        NotificationType.POST_REJECTED,
                        "Bài đăng của bạn đã bị gỡ",
                        "Bài đăng cho phòng '" + roomTitle + "' đã bị gỡ do vi phạm sau khi quản trị viên xử lý báo cáo. Lý do: " + report.getResolution(),
                        "post",
                        post.getId()
                );
            }

            notificationService.createAndSendNotification(
                    report.getReporter(),
                    NotificationType.REPORT_RESOLVED,
                    "Báo cáo của bạn đã được giải quyết",
                    "Báo cáo của bạn về bài đăng '" + roomTitle + "' đã được giải quyết. Kết quả: " + report.getResolution(),
                    "report",
                    report.getId()
            );
        }
    }
}
