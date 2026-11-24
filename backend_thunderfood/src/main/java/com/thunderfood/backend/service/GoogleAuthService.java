package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.auth.GoogleUserInfo;

public interface GoogleAuthService {

    GoogleUserInfo verifyToken(String idToken);
}
