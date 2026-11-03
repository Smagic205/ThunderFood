package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.order.*;
import org.springframework.data.domain.Pageable;

public interface OrderService {

    CheckoutPreviewResponse previewCheckout(Long userId, CheckoutPreviewRequest request);

    OrderResponse placeOrder(Long userId, PlaceOrderRequest request);

    PageResponse<OrderListResponse> getUserOrders(Long userId, String status, Pageable pageable);

    OrderResponse getOrderDetail(Long userId, Long orderId);

    OrderTrackingResponse getOrderTracking(Long userId, Long orderId);

    OrderResponse cancelOrder(Long userId, Long orderId, CancelOrderRequest request);
}
