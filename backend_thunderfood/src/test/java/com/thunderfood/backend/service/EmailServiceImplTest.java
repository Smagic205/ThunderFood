package com.thunderfood.backend.service;

import com.thunderfood.backend.service.impl.EmailServiceImpl;
import jakarta.mail.BodyPart;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@thunderfood.com");
    }

    @Test
    @DisplayName("sendAccountActivationEmail escape HTML trong fullName để chống HTML Injection")
    void sendAccountActivationEmail_EscapesHtmlInDisplayName() throws Exception {
        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendAccountActivationEmail(
                "user@example.com",
                "<img src=x onerror=alert(1)>",
                "https://thunderfoods.vercel.app/verify-email?token=abc-123"
        );

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());

        String body = extractText(captor.getValue().getContent());
        assertFalse(body.contains("<img src=x"));
        assertTrue(body.contains("&lt;img src=x onerror=alert(1)&gt;"));
    }

    @Test
    @DisplayName("sendAccountActivationEmail từ chối activationLink sử dụng scheme nguy hiểm")
    void sendAccountActivationEmail_RejectsUnsafeLink() {
        assertThrows(IllegalArgumentException.class, () ->
                emailService.sendAccountActivationEmail("user@example.com", "An", "javascript:alert(1)")
        );
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    private String extractText(Object content) throws Exception {
        if (content instanceof String str) {
            return str;
        }
        if (content instanceof Multipart multipart) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < multipart.getCount(); i++) {
                BodyPart part = multipart.getBodyPart(i);
                sb.append(extractText(part.getContent()));
            }
            return sb.toString();
        }
        return "";
    }
}
