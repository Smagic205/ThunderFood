package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.order.CancelOrderRequest;
import com.thunderfood.backend.dto.staff.ConfirmOrderRequest;
import com.thunderfood.backend.dto.staff.DeliveryPackageResponse;
import com.thunderfood.backend.dto.staff.FailDeliveryRequest;
import com.thunderfood.backend.dto.staff.StaffOrderDetailResponse;
import com.thunderfood.backend.dto.staff.StaffOrderListResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface StaffOrderService {

    /**
     * Lọc danh sách đơn hàng cho Staff: hỗ trợ lọc Quận -> Phường -> Số nhà/tên đường
     */
    PageResponse<StaffOrderListResponse> getStaffOrders(
            String status,
            String district,
            String ward,
            String streetKeyword,
            String search,
            Pageable pageable
    );

    List<String> getDistricts();

    List<String> getWardsByDistrict(String district);

    StaffOrderDetailResponse getStaffOrderDetail(Long orderId);

    StaffOrderDetailResponse confirmOrder(Long orderId, ConfirmOrderRequest request, Long staffId);

    StaffOrderDetailResponse cancelOrderByStaff(Long orderId, CancelOrderRequest request, Long staffId);

    List<DeliveryPackageResponse> getOpenPackages();

    /**
     * Nhân viên nhận giao gói hàng (tối đa 1 gói DELIVERING/nhân viên).
     * Chuyển gói và toàn bộ đơn CONFIRMED trong gói sang DELIVERING.
     */
    DeliveryPackageResponse claimPackage(Long packageId, Long staffId);

    /**
     * Xác nhận giao hàng thành công từng đơn:
     * - Lưu deliveredAt
     * - Tự động thu tiền COD (UNPAID -> PAID)
     * - Tự động hoàn tất gói hàng nếu tất cả các đơn trong gói đã giao/hủy
     */
    StaffOrderDetailResponse deliverOrder(Long orderId, Long staffId);

    /**
     * Hủy đơn khi giao hàng thất bại (khách boom, không liên lạc được...):
     * - Cập nhật status = CANCELLED kèm lý do
     * - Tự động hoàn tất gói hàng nếu tất cả các đơn trong gói đã giao/hủy
     */
    StaffOrderDetailResponse failDelivery(Long orderId, FailDeliveryRequest request, Long staffId);

    /**
     * Lấy gói hàng hiện tại nhân viên đang giao
     */
    DeliveryPackageResponse getMyHeldPackage(Long staffId);

    /**
     * Lấy danh sách các đơn trong một gói cụ thể
     */
    List<StaffOrderListResponse> getOrdersByPackageId(Long packageId);
}
