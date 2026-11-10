package com.thunderfood.backend.dto.staff;

import com.thunderfood.backend.entity.DeliveryPackage;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryPackageResponse {

    private Long id;
    private String packageName;
    private String status;
    private Integer maxOrders;
    private Integer currentOrdersCount;
    private Long shippedByStaffId;
    private String shippedByStaffName;
    private String shippedByStaffPhone;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    @Builder.Default
    private List<String> orderCodes = new ArrayList<>();

    public static DeliveryPackageResponse fromEntity(DeliveryPackage pkg, List<String> orderCodes) {
        if (pkg == null) {
            return null;
        }
        List<String> codes = orderCodes != null ? orderCodes : new ArrayList<>();
        return DeliveryPackageResponse.builder()
                .id(pkg.getId())
                .packageName(pkg.getPackageName())
                .status(pkg.getStatus())
                .maxOrders(pkg.getMaxOrders())
                .currentOrdersCount(codes.size())
                .shippedByStaffId(pkg.getShippedByStaff() != null ? pkg.getShippedByStaff().getId() : null)
                .shippedByStaffName(pkg.getShippedByStaff() != null ? pkg.getShippedByStaff().getFullName() : null)
                .shippedByStaffPhone(pkg.getShippedByStaff() != null ? pkg.getShippedByStaff().getPhone() : null)
                .createdAt(pkg.getCreatedAt())
                .completedAt(pkg.getCompletedAt())
                .orderCodes(codes)
                .build();
    }
}

