package com.thunderfood.backend.dto.address;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.thunderfood.backend.entity.Address;
import com.thunderfood.backend.entity.ServiceWard;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin chi tiết địa chỉ nhận hàng của khách hàng")
public class AddressResponse {

    @Schema(description = "ID địa chỉ", example = "1")
    private Long id;

    @Schema(description = "Họ tên người nhận", example = "Nguyễn Văn A")
    private String receiverName;

    @Schema(description = "Số điện thoại nhận hàng", example = "0987654321")
    private String phone;

    @Schema(description = "Địa chỉ nhà (số nhà, ngõ, đường)", example = "Số 120, Ngõ 5 Yên Lãng")
    private String detailAddress;

    @Schema(description = "Thông tin phường/xã đã chọn")
    private ServiceWardResponse ward;

    @Schema(description = "Địa chỉ đầy đủ ghép từ địa chỉ nhà và phường/xã", example = "Số 120, Ngõ 5 Yên Lãng, Phường Yên Lãng, Hà Nội")
    private String fullAddress;

    @Schema(description = "Có phải địa chỉ giao hàng mặc định không", example = "true")
    private Boolean isDefault;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "Thời gian tạo địa chỉ")
    private LocalDateTime createdAt;

    public static AddressResponse fromEntity(Address address) {
        if (address == null) {
            return null;
        }

        ServiceWard ward = address.getWard();
        ServiceWardResponse wardResponse = ServiceWardResponse.fromEntity(ward);
        String wardDisplayName = (wardResponse != null && wardResponse.getDisplayName() != null)
                ? wardResponse.getDisplayName()
                : "";

        StringBuilder full = new StringBuilder();
        if (address.getDetailAddress() != null && !address.getDetailAddress().isBlank()) {
            full.append(address.getDetailAddress().trim());
        }
        if (!wardDisplayName.isBlank()) {
            if (full.length() > 0) full.append(", ");
            full.append(wardDisplayName);
        }
        if (full.length() > 0) {
            full.append(", Hà Nội");
        }

        return AddressResponse.builder()
                .id(address.getId())
                .receiverName(address.getReceiverName())
                .phone(address.getPhone())
                .detailAddress(address.getDetailAddress())
                .ward(wardResponse)
                .fullAddress(full.toString())
                .isDefault(address.getIsDefault())
                .createdAt(address.getCreatedAt())
                .build();
    }
}
