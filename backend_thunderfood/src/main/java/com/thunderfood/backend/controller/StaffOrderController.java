package com.thunderfood.backend.controller;

import com.thunderfood.backend.config.security.SecurityUtils;
import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.order.CancelOrderRequest;
import com.thunderfood.backend.dto.staff.*;
import com.thunderfood.backend.service.StaffOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/staff/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
@Tag(name = "Staff Order Controller", description = "Toàn bộ chức năng vận hành đơn hàng, gói hàng và giao hàng cho Staff")
public class StaffOrderController {

    private final StaffOrderService staffOrderService;

    @GetMapping
    @Operation(summary = "Lấy danh sách đơn hàng cho Staff (lọc Quận -> Phường -> Số nhà/tên đường, trạng thái, tìm kiếm)")
    public ResponseEntity<ApiResponse<PageResponse<StaffOrderListResponse>>> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String ward,
            @RequestParam(required = false) String streetKeyword,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<StaffOrderListResponse> response = staffOrderService.getStaffOrders(
                status, district, ward, streetKeyword, search, pageable
        );
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công", response));
    }

    @GetMapping("/districts")
    @Operation(summary = "Lấy danh sách các Quận/Huyện đang phục vụ để lọc cấp 1")
    public ResponseEntity<ApiResponse<List<String>>> getDistricts() {
        List<String> response = staffOrderService.getDistricts();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách quận/huyện thành công", response));
    }

    @GetMapping("/wards")
    @Operation(summary = "Lấy danh sách các Phường/Xã theo Quận/Huyện để lọc cấp 2")
    public ResponseEntity<ApiResponse<List<String>>> getWardsByDistrict(
            @RequestParam(required = false) String district
    ) {
        List<String> response = staffOrderService.getWardsByDistrict(district);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phường/xã thành công", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết đơn hàng cho nhân viên")
    public ResponseEntity<ApiResponse<StaffOrderDetailResponse>> getOrderDetail(@PathVariable Long id) {
        StaffOrderDetailResponse response = staffOrderService.getStaffOrderDetail(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết đơn hàng thành công", response));
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Nhân viên xác nhận đơn hàng và gán vào gói hàng (gói có sẵn hoặc tạo mới, giới hạn tối đa N đơn)")
    public ResponseEntity<ApiResponse<StaffOrderDetailResponse>> confirmOrder(
            @PathVariable Long id,
            @Valid @RequestBody ConfirmOrderRequest request
    ) {
        Long staffId = getRequiredUserId();
        StaffOrderDetailResponse response = staffOrderService.confirmOrder(id, request, staffId);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận đơn hàng và gán gói thành công", response));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Nhân viên hủy đơn hàng khi đơn còn ở trạng thái PENDING (hoàn kho, hoàn voucher)")
    public ResponseEntity<ApiResponse<StaffOrderDetailResponse>> cancelOrder(
            @PathVariable Long id,
            @Valid @RequestBody CancelOrderRequest request
    ) {
        Long staffId = getRequiredUserId();
        StaffOrderDetailResponse response = staffOrderService.cancelOrderByStaff(id, request, staffId);
        return ResponseEntity.ok(ApiResponse.success("Hủy đơn hàng thành công", response));
    }

    @GetMapping("/packages/open")
    @Operation(summary = "Lấy danh sách các gói hàng đang mở (PENDING) để chọn khi duyệt đơn")
    public ResponseEntity<ApiResponse<List<DeliveryPackageResponse>>> getOpenPackages() {
        List<DeliveryPackageResponse> response = staffOrderService.getOpenPackages();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách gói hàng đang mở thành công", response));
    }

    @PostMapping("/packages/{packageId}/claim")
    @Operation(summary = "Shipper nhận giao gói hàng (chuyển gói và các đơn sang DELIVERING, giới hạn 1 gói/shipper)")
    public ResponseEntity<ApiResponse<DeliveryPackageResponse>> claimPackage(@PathVariable Long packageId) {
        Long staffId = getRequiredUserId();
        DeliveryPackageResponse response = staffOrderService.claimPackage(packageId, staffId);
        return ResponseEntity.ok(ApiResponse.success("Nhận giao gói hàng thành công", response));
    }

    @GetMapping("/packages/my-held")
    @Operation(summary = "Lấy gói hàng hiện tại shipper đang nhận giao (nếu có)")
    public ResponseEntity<ApiResponse<DeliveryPackageResponse>> getMyHeldPackage() {
        Long staffId = getRequiredUserId();
        DeliveryPackageResponse response = staffOrderService.getMyHeldPackage(staffId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin gói hàng đang giao thành công", response));
    }

    @GetMapping("/packages/{packageId}/orders")
    @Operation(summary = "Lấy danh sách các đơn hàng trong một gói giao hàng cụ thể")
    public ResponseEntity<ApiResponse<List<StaffOrderListResponse>>> getOrdersByPackageId(@PathVariable Long packageId) {
        List<StaffOrderListResponse> response = staffOrderService.getOrdersByPackageId(packageId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn trong gói thành công", response));
    }

    @PostMapping("/{id}/deliver")
    @Operation(summary = "Shipper xác nhận giao thành công từng đơn (tự động thu tiền COD, tự hoàn tất gói khi xong)")
    public ResponseEntity<ApiResponse<StaffOrderDetailResponse>> deliverOrder(@PathVariable Long id) {
        Long staffId = getRequiredUserId();
        StaffOrderDetailResponse response = staffOrderService.deliverOrder(id, staffId);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận giao hàng thành công", response));
    }

    @PostMapping("/{id}/fail")
    @Operation(summary = "Shipper báo giao hàng thất bại khi đang DELIVERING (kèm lý do, tự hoàn tất gói khi xong)")
    public ResponseEntity<ApiResponse<StaffOrderDetailResponse>> failDelivery(
            @PathVariable Long id,
            @Valid @RequestBody FailDeliveryRequest request
    ) {
        Long staffId = getRequiredUserId();
        StaffOrderDetailResponse response = staffOrderService.failDelivery(id, request, staffId);
        return ResponseEntity.ok(ApiResponse.success("Ghi nhận giao hàng thất bại thành công", response));
    }

    private Long getRequiredUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new AccessDeniedException("Vui lòng đăng nhập để thực hiện chức năng này"));
    }
}
