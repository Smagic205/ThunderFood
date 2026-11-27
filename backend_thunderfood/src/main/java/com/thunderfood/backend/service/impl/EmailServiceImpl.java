package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.service.EmailService;
import com.thunderfood.backend.validation.UrlSafetyUtils;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@thunderfood.com}")
    private String fromEmail;

    @Override
    public void sendPasswordResetOtp(String to, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Yêu cầu đặt lại mật khẩu - ThunderFood");

            String safeOtp = HtmlUtils.htmlEscape(otp != null ? otp.trim() : "", StandardCharsets.UTF_8.name());

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>"
                    + "<h2 style='color: #ff6b6b; text-align: center;'>ThunderFood - Đặt lại mật khẩu</h2>"
                    + "<p>Xin chào,</p>"
                    + "<p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP dưới đây để tiến hành đặt lại mật khẩu:</p>"
                    + "<div style='background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; border-radius: 5px; margin: 20px 0;'>"
                    + safeOtp
                    + "</div>"
                    + "<p style='color: #6c757d; font-size: 14px;'>Mã OTP này sẽ hết hạn sau 15 phút.</p>"
                    + "<p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>"
                    + "<br>"
                    + "<p>Trân trọng,<br>Đội ngũ ThunderFood</p>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Lỗi khi gửi email: " + e.getMessage(), e);
        }
    }

    @Override
    public void sendAccountActivationEmail(String to, String fullName, String activationLink) {
        if (!UrlSafetyUtils.isSafeUrl(activationLink, false)) {
            throw new IllegalArgumentException("Liên kết kích hoạt không hợp lệ");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Xác nhận kích hoạt tài khoản - ThunderFood");

            String rawName = (fullName != null && !fullName.isBlank()) ? fullName.trim() : "Quý khách";
            String safeDisplayName = HtmlUtils.htmlEscape(rawName, StandardCharsets.UTF_8.name());
            String safeActivationLink = HtmlUtils.htmlEscape(activationLink != null ? activationLink.trim() : "", StandardCharsets.UTF_8.name());

            String htmlContent = "<div style='font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;'>"
                    + "<div style='text-align: center; margin-bottom: 24px;'>"
                    + "<h1 style='color: #ff5722; font-size: 26px; margin: 0;'>⚡ ThunderFood</h1>"
                    + "<p style='color: #777; font-size: 14px; margin-top: 4px;'>Giao đồ ăn chớp nhoáng</p>"
                    + "</div>"
                    + "<h2 style='color: #222; font-size: 20px;'>Kích hoạt tài khoản của bạn</h2>"
                    + "<p style='color: #444; font-size: 15px; line-height: 1.6;'>Xin chào <strong>" + safeDisplayName + "</strong>,</p>"
                    + "<p style='color: #444; font-size: 15px; line-height: 1.6;'>Cảm ơn bạn đã đăng ký tài khoản tại <strong>ThunderFood</strong>. Để bắt đầu đặt món và nhận các ưu đãi hấp dẫn, vui lòng nhấn vào nút bên dưới để kích hoạt tài khoản của bạn:</p>"
                    + "<div style='text-align: center; margin: 32px 0;'>"
                    + "<a href='" + safeActivationLink + "' style='display: inline-block; background-color: #ff5722; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 16px; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 10px rgba(255, 87, 34, 0.3);'>Kích hoạt tài khoản ngay</a>"
                    + "</div>"
                    + "<p style='color: #666; font-size: 13px; line-height: 1.5;'>Nếu nút bấm trên không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:<br>"
                    + "<a href='" + safeActivationLink + "' style='color: #ff5722; word-break: break-all;'>" + safeActivationLink + "</a></p>"
                    + "<div style='border-top: 1px solid #eee; margin-top: 32px; padding-top: 16px; font-size: 12px; color: #999;'>"
                    + "<p style='margin: 0;'>* Liên kết này có hiệu lực trong vòng <strong>24 giờ</strong>.</p>"
                    + "<p style='margin: 4px 0 0 0;'>Nếu bạn không thực hiện đăng ký tài khoản này, vui lòng bỏ qua email.</p>"
                    + "<p style='margin: 12px 0 0 0;'>Trân trọng,<br><strong>Đội ngũ phát triển ThunderFood</strong></p>"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Lỗi khi gửi email kích hoạt tài khoản: " + e.getMessage(), e);
        }
    }
}
