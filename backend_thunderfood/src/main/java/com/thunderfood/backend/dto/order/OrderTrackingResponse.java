package com.thunderfood.backend.dto.order;

import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderTrackingResponse {

    private Long orderId;
    private String orderCode;
    private String currentStatus;
    private LocalDateTime createdAt;
    private LocalDateTime deliveredAt;

    private String shipperName;
    private String shipperPhone;

    @Builder.Default
    private List<OrderStatusHistoryResponse> timeline = new ArrayList<>();
}
