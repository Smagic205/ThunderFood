package com.thunderfood.backend.dto.address;

import com.thunderfood.backend.entity.ServiceWard;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin phường/xã phục vụ giao hàng hiển thị cho khách lựa chọn")
public class ServiceWardResponse {

    @Schema(description = "ID phường/xã", example = "1")
    private Integer id;

    @Schema(description = "Tên phường/xã", example = "Yên Lãng")
    private String wardName;

    @Schema(description = "Loại đơn vị hành chính: PHUONG hoặc XA", example = "PHUONG")
    private String type;

    @Schema(description = "Tên hiển thị đầy đủ (có tiền tố Phường/Xã)", example = "Phường Yên Lãng")
    private String displayName;

    @Schema(description = "Phí ship áp dụng cho khu vực này (VND)", example = "20000.00")
    private BigDecimal shippingFee;

    @Schema(description = "Trạng thái phục vụ (true = đang giao hàng)", example = "true")
    private Boolean isActive;

    public static ServiceWardResponse fromEntity(ServiceWard ward) {
        if (ward == null) {
            return null;
        }
        String prefix = "PHUONG".equalsIgnoreCase(ward.getType()) ? "Phường " : "Xã ";
        return ServiceWardResponse.builder()
                .id(ward.getId())
                .wardName(ward.getWardName())
                .type(ward.getType())
                .displayName(prefix + ward.getWardName())
                .shippingFee(ward.getShippingFee())
                .isActive(ward.getIsActive())
                .build();
    }
}
