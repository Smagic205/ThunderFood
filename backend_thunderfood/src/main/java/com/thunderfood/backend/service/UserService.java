package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.auth.RegisterRequest;
import com.thunderfood.backend.dto.staff.StaffAccountResponse;
import com.thunderfood.backend.dto.user.CustomerProfileResponse;
import com.thunderfood.backend.dto.user.UpdateCustomerProfileRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserService {

    CustomerProfileResponse getCustomerProfile(Long userId);

    CustomerProfileResponse updateCustomerProfile(Long userId, UpdateCustomerProfileRequest request);

    CustomerProfileResponse updateAvatar(Long userId, MultipartFile file);

    StaffAccountResponse createStaffAccount(RegisterRequest request);

    List<StaffAccountResponse> getAllStaffs();
}
