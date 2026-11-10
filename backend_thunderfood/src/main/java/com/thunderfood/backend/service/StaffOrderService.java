package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.order.CancelOrderRequest;
import com.thunderfood.backend.dto.staff.ConfirmOrderRequest;
import com.thunderfood.backend.dto.staff.DeliveryPackageResponse;
import com.thunderfood.backend.dto.staff.StaffOrderDetailResponse;
import com.thunderfood.backend.dto.staff.StaffOrderListResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface StaffOrderService {

    PageResponse<StaffOrderListResponse> getStaffOrders(String status, String ward, String search, Pageable pageable);

    StaffOrderDetailResponse getStaffOrderDetail(Long orderId);

    StaffOrderDetailResponse confirmOrder(Long orderId, ConfirmOrderRequest request, Long staffId);

    StaffOrderDetailResponse cancelOrderByStaff(Long orderId, CancelOrderRequest request, Long staffId);

    List<DeliveryPackageResponse> getOpenPackages();
}

