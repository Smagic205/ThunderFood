package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.address.ServiceWardResponse;
import com.thunderfood.backend.dto.common.PageResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface ServiceWardService {

    PageResponse<ServiceWardResponse> getAllWardsForAdmin(String district, String keyword, Boolean isActive, Pageable pageable);

    List<String> getDistricts();

    ServiceWardResponse getWardById(Integer id);

    ServiceWardResponse updateShippingFee(Integer id, BigDecimal fee);

    ServiceWardResponse toggleWardActive(Integer id);
}

