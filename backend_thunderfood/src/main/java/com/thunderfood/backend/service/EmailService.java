package com.thunderfood.backend.service;

public interface EmailService {

    void sendPasswordResetOtp(String to, String otp);
}
