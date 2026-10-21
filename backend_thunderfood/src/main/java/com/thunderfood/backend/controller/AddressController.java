package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.SecurityUtils;
import com.thunderfood.backend.config.security.UserDetailsImpl;
import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.address.AddressResponse;
import com.thunderfood.backend.dto.address.CreateAddressRequest;
import com.thunderfood.backend.dto.address.ServiceWardResponse;
import com.thunderfood.backend.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/addresses")
@RequiredArgsConstructor
@Tag(name = "Address & Delivery Area Controller", description = "Quản lý danh sách phường/xã phục vụ và địa chỉ nhận hàng của khách hàng")
public class AddressController {

    private final AddressService addressService;

    /**
     * 1. Lấy danh sách phường/xã hiển thị sang frontend để user lựa chọn (dropdown / combobox)
     * Có thể tìm kiếm theo từ khóa hoặc lọc theo kiểu (PHUONG hoặc XA)
     */
    @GetMapping("/wards")
    @Operation(summary = "Lấy danh sách phường/xã phục vụ giao hàng (cho frontend hiển thị để user chọn)")
    public ResponseEntity<ApiResponse<List<ServiceWardResponse>>> getServiceWards(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type
    ) {
        List<ServiceWardResponse> wards = addressService.getActiveWards(keyword, type);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phường/xã thành công", wards));
    }

    /**
     * 2. Lưu địa chỉ nhận hàng sau khi user đã chọn phường/xã và nhập địa chỉ nhà
     * Dữ liệu gửi sang bao gồm tên và kiểu (xã/phường) hoặc wardId, cùng với phần địa chỉ nhà
     */
    @PostMapping
    @Operation(summary = "Lưu địa chỉ nhận hàng mới của khách hàng (sau khi chọn phường/xã và nhập số nhà/địa chỉ nhà)")
    public ResponseEntity<ApiResponse<AddressResponse>> createAddress(
            @Valid @RequestBody CreateAddressRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = getAuthenticatedUserId(userDetails);
        AddressResponse response = addressService.createAddress(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Lưu địa chỉ nhận hàng thành công", response), HttpStatus.CREATED);
    }

    /**
     * 3. Lấy danh sách toàn bộ địa chỉ nhận hàng của khách hàng đang đăng nhập
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách địa chỉ nhận hàng của khách hàng hiện tại")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getMyAddresses(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = getAuthenticatedUserId(userDetails);
        List<AddressResponse> addresses = addressService.getUserAddresses(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách địa chỉ thành công", addresses));
    }

    /**
     * 4. Lấy địa chỉ mặc định của khách hàng đang đăng nhập
     */
    @GetMapping("/default")
    @Operation(summary = "Lấy địa chỉ giao hàng mặc định của khách hàng hiện tại")
    public ResponseEntity<ApiResponse<AddressResponse>> getDefaultAddress(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = getAuthenticatedUserId(userDetails);
        AddressResponse defaultAddress = addressService.getDefaultAddress(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy địa chỉ mặc định thành công", defaultAddress));
    }

    /**
     * 4. Lấy chi tiết 1 địa chỉ theo ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết một địa chỉ nhận hàng")
    public ResponseEntity<ApiResponse<AddressResponse>> getAddressById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = getAuthenticatedUserId(userDetails);
        AddressResponse address = addressService.getAddressById(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin địa chỉ thành công", address));
    }

    /**
     * 5. Cập nhật địa chỉ nhận hàng
     */
    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật địa chỉ nhận hàng")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody CreateAddressRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = getAuthenticatedUserId(userDetails);
        AddressResponse updated = addressService.updateAddress(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật địa chỉ thành công", updated));
    }

    /**
     * 6. Đặt làm địa chỉ mặc định
     */
    @PatchMapping("/{id}/default")
    @Operation(summary = "Thiết lập địa chỉ làm mặc định")
    public ResponseEntity<ApiResponse<AddressResponse>> setDefaultAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = getAuthenticatedUserId(userDetails);
        AddressResponse response = addressService.setDefaultAddress(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Đặt làm địa chỉ mặc định thành công", response));
    }

    /**
     * 7. Xóa địa chỉ nhận hàng
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa địa chỉ nhận hàng")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = getAuthenticatedUserId(userDetails);
        addressService.deleteAddress(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa địa chỉ thành công", null));
    }

    private Long getAuthenticatedUserId(UserDetailsImpl userDetails) {
        if (userDetails != null && userDetails.getUser() != null && userDetails.getUser().getId() != null) {
            return userDetails.getUser().getId();
        }
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new RuntimeException("Người dùng chưa đăng nhập hoặc phiên làm việc đã hết hạn"));
    }
}
