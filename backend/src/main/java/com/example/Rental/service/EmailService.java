package com.example.Rental.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Async
    public void sendResetPasswordEmail(String toEmail,
            String fullName,
            String resetToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("[EasyAccomod] Đặt lại mật khẩu");
            helper.setText(buildResetEmailHtml(fullName, resetToken), true);

            mailSender.send(message);
            log.info("Reset password email sent to: {}", toEmail);

        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
            // Không throw exception để không ảnh hưởng luồng chính
        }
    }

    private String buildResetEmailHtml(String fullName, String resetToken) {
        String resetLink = frontendUrl
                + "/reset-password?token=" + resetToken;

        return """
                <div style="font-family: Arial, sans-serif; max-width: 600px;
                            margin: 0 auto; padding: 20px;">

                  <h2 style="color: #1F4E79;">EasyAccomod</h2>
                  <hr style="border-color: #D6E4F0;"/>

                  <p>Xin chào <strong>%s</strong>,</p>

                  <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản
                     của bạn.</p>

                  <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="%s"
                       style="background-color: #1F4E79; color: white;
                              padding: 12px 30px; text-decoration: none;
                              border-radius: 5px; font-size: 16px;">
                      Đặt lại mật khẩu
                    </a>
                  </div>

                  <p style="color: #888; font-size: 13px;">
                    Link có hiệu lực trong <strong>30 phút</strong>.
                    Nếu bạn không yêu cầu đặt lại mật khẩu,
                    hãy bỏ qua email này.
                  </p>

                  <p style="color: #888; font-size: 12px;">
                    Hoặc copy link này vào trình duyệt:<br/>
                    <a href="%s" style="color: #2E75B6;">%s</a>
                  </p>

                  <hr style="border-color: #D6E4F0;"/>
                  <p style="color: #aaa; font-size: 11px;">
                    © 2024 EasyAccomod. Email này được gửi tự động,
                    vui lòng không trả lời.
                  </p>
                </div>
                """.formatted(fullName, resetLink, resetLink, resetLink);
    }
}
