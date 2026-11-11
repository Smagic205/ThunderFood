package com.thunderfood.backend.dto.dashboard;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipperPerformanceResponse {

    private Long staffId;
    private String staffName;
    private String email;
    private String phone;
    private int totalPackages;
    private int totalOrders;
    private int deliveredOrders;
    private int failedOrders;
    private double successRate; // % giao thành công
    private double avgDeliveryMinutes; // thời gian giao trung bình tính theo phút
}

