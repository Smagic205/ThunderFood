package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.user.CustomerProfileResponse;
import com.thunderfood.backend.dto.user.UpdateCustomerProfileRequest;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {

    CustomerProfileResponse getCustomerProfile(Long userId);

    CustomerProfileResponse updateCustomerProfile(Long userId, UpdateCustomerProfileRequest request);

    CustomerProfileResponse updateAvatar(Long userId, MultipartFile file);
}
