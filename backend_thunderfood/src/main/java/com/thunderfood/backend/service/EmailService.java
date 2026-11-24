package com.thunderfood.backend.service;

public interface EmailService {

    void sendPasswordResetOtp(String to, String otp);

    void sendAccountActivationEmail(String to, String fullName, String activationLink);
}
