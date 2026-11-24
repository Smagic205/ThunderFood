package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.admin.AdminPackageResponse;

import java.util.List;

public interface AdminPackageService {

    List<AdminPackageResponse> getAllPackages(String status);

    AdminPackageResponse getPackageByCode(String code);

    AdminPackageResponse assignStaff(Long packageId, Long staffId);

    void deletePackage(Long packageId);
}
