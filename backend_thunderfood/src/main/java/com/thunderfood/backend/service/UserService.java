package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.auth.RegisterRequest;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.staff.StaffAccountResponse;
import com.thunderfood.backend.dto.user.CustomerProfileResponse;
import com.thunderfood.backend.dto.user.UpdateCustomerProfileRequest;
import com.thunderfood.backend.dto.user.UpdateUserRoleRequest;
import com.thunderfood.backend.dto.user.UpdateUserStatusRequest;
import com.thunderfood.backend.dto.user.UserAdminResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserService {

    CustomerProfileResponse getCustomerProfile(Long userId);

    CustomerProfileResponse updateCustomerProfile(Long userId, UpdateCustomerProfileRequest request);

    CustomerProfileResponse updateAvatar(Long userId, MultipartFile file);

    StaffAccountResponse createStaffAccount(RegisterRequest request);

    List<StaffAccountResponse> getAllStaffs();

    // ── Quản lý tài khoản cho Admin ──────────────────────────────────────────
    PageResponse<UserAdminResponse> getAllUsersForAdmin(String keyword, String role, String status, Pageable pageable);

    UserAdminResponse getUserDetailForAdmin(Long id);

    UserAdminResponse updateUserStatus(Long id, UpdateUserStatusRequest request, Long currentAdminId);

    UserAdminResponse updateUserRole(Long id, UpdateUserRoleRequest request, Long currentAdminId);
}
