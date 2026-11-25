package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.admin.AdminPackageResponse;

import java.time.LocalDate;
import java.util.List;

public interface AdminPackageService {

    List<AdminPackageResponse> getAllPackages(String status, LocalDate startDate, LocalDate endDate);

    AdminPackageResponse getPackageByCode(String code);

    AdminPackageResponse assignStaff(Long packageId, Long staffId);

    void deletePackage(Long packageId);
}
