package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.admin.AdminOrderResponse;
import com.thunderfood.backend.dto.admin.UpdateOrderStatusRequest;

import java.time.LocalDate;
import java.util.List;

public interface AdminOrderService {

    List<AdminOrderResponse> getAllOrders(String status, String search, LocalDate startDate, LocalDate endDate);

    AdminOrderResponse getOrderByCode(String orderCode);

    AdminOrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request, Long adminId);

    AdminOrderResponse cancelOrder(Long orderId, String reason, Long adminId);
}
