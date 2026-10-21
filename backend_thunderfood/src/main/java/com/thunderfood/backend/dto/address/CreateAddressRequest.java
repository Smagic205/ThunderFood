package com.thunderfood.backend.dto.address;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Dữ liệu yêu cầu lưu địa chỉ nhận hàng của khách hàng")
public class CreateAddressRequest {

    @NotBlank(message = "Địa chỉ nhà (số nhà, ngõ, đường) không được để trống")
    @Size(max = 500, message = "Địa chỉ nhà không được vượt quá 500 ký tự")
    @Schema(description = "Địa chỉ nhà cụ thể: số nhà, tên ngõ, tên đường", example = "Số 120, Ngõ 5 Yên Lãng")
    private String detailAddress;

    @Schema(description = "Tên phường/xã khách đã chọn (vd: Yên Lãng, Trung Tự)", example = "Yên Lãng")
    private String wardName;

    @Schema(description = "Kiểu đơn vị hành chính: PHUONG (Phường) hoặc XA (Xã)", example = "PHUONG")
    private String wardType;

    @Schema(description = "ID phường/xã (tùy chọn nếu frontend đã gửi wardName và wardType)", example = "1")
    private Integer wardId;

    @Size(max = 150, message = "Tên người nhận không được vượt quá 150 ký tự")
    @Schema(description = "Họ tên người nhận (nếu để trống sẽ tự lấy tên tài khoản)", example = "Nguyễn Văn A")
    private String receiverName;

    @Pattern(
            regexp = "^(0|\\+84)(\\s|\\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\\d)(\\s|\\.)?(\\d{3})(\\s|\\.)?(\\d{3})$|^$",
            message = "Số điện thoại người nhận không đúng định dạng"
    )
    @Schema(description = "Số điện thoại nhận hàng (nếu để trống sẽ tự lấy SĐT tài khoản)", example = "0987654321")
    private String phone;

    @Schema(description = "Đặt làm địa chỉ mặc định hay không", example = "true")
    private Boolean isDefault;
}
