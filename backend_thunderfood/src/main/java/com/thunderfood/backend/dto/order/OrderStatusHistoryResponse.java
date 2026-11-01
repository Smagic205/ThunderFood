package com.thunderfood.backend.dto.order;

import com.thunderfood.backend.entity.OrderStatusHistory;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusHistoryResponse {

    private Long id;
    private String status;
    private String note;
    private String changedBy;
    private LocalDateTime createdAt;

    public static OrderStatusHistoryResponse fromEntity(OrderStatusHistory history) {
        if (history == null) {
            return null;
        }
        String changedByName = null;
        if (history.getChangedBy() != null) {
            changedByName = history.getChangedBy().getFullName();
        }
        return OrderStatusHistoryResponse.builder()
                .id(history.getId())
                .status(history.getStatus())
                .note(history.getNote())
                .changedBy(changedByName)
                .createdAt(history.getCreatedAt())
                .build();
    }
}
