package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.order.CancelOrderRequest;
import com.thunderfood.backend.dto.order.OrderItemResponse;
import com.thunderfood.backend.dto.order.OrderStatusHistoryResponse;
import com.thunderfood.backend.dto.staff.ConfirmOrderRequest;
import com.thunderfood.backend.dto.staff.DeliveryPackageResponse;
import com.thunderfood.backend.dto.staff.StaffOrderDetailResponse;
import com.thunderfood.backend.dto.staff.StaffOrderListResponse;
import com.thunderfood.backend.dto.voucher.VoucherClientResponse;
import com.thunderfood.backend.entity.*;
import com.thunderfood.backend.exception.ConflictException;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.*;
import com.thunderfood.backend.service.StaffOrderService;
import com.thunderfood.backend.service.VoucherService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffOrderServiceImpl implements StaffOrderService {

    private final OrderRepository orderRepository;
    private final DeliveryPackageRepository deliveryPackageRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final VoucherService voucherService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StaffOrderListResponse> getStaffOrders(
            String status,
            String ward,
            String search,
            Pageable pageable
    ) {
        Specification<Order> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Lọc theo trạng thái đơn hàng (nếu khác ALL và không rỗng)
            if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase()));
            }

            // 2. Lọc theo Phường/Xã
            if (ward != null && !ward.isBlank() && !ward.equalsIgnoreCase("ALL")) {
                String wardPattern = "%" + ward.trim().toLowerCase() + "%";
                Join<Order, Address> addressJoin = root.join("address", JoinType.LEFT);
                Join<Address, ServiceWard> wardJoin = addressJoin.join("ward", JoinType.LEFT);

                Predicate matchWardEntity = cb.like(cb.lower(wardJoin.get("wardName")), wardPattern);
                Predicate matchShippingAddr = cb.like(cb.lower(root.get("shippingAddress")), wardPattern);
                predicates.add(cb.or(matchWardEntity, matchShippingAddr));
            }

            // 3. Tìm kiếm theo mã đơn, tên khách, số điện thoại
            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                String phoneNoSpace = search.trim().replaceAll("\\s+", "");

                Predicate matchOrderCode = cb.like(cb.lower(root.get("orderCode")), searchPattern);
                Predicate matchReceiverName = cb.like(cb.lower(root.get("receiverName")), searchPattern);
                Predicate matchPhone = cb.like(root.get("receiverPhone"), "%" + phoneNoSpace + "%");

                predicates.add(cb.or(matchOrderCode, matchReceiverName, matchPhone));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Ưu tiên FIFO (đơn cũ xử lý trước) đối với các đơn đang cần xử lý (PENDING, CONFIRMED, DELIVERING)
        Sort sort;
        if (pageable.getSort().isSorted()) {
            sort = pageable.getSort();
        } else if ("PENDING".equalsIgnoreCase(status) || "CONFIRMED".equalsIgnoreCase(status) || "DELIVERING".equalsIgnoreCase(status)) {
            sort = Sort.by(Sort.Direction.ASC, "createdAt");
        } else {
            sort = Sort.by(Sort.Direction.DESC, "createdAt");
        }

        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        Page<Order> orderPage = orderRepository.findAll(spec, sortedPageable);

        List<StaffOrderListResponse> content = orderPage.getContent().stream()
                .map(StaffOrderListResponse::fromEntity)
                .toList();

        PaginationInfo pagination = PaginationInfo.builder()
                .page(orderPage.getNumber())
                .size(orderPage.getSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .hasNext(orderPage.hasNext())
                .hasPrevious(orderPage.hasPrevious())
                .build();

        return PageResponse.<StaffOrderListResponse>builder()
                .content(content)
                .pagination(pagination)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public StaffOrderDetailResponse getStaffOrderDetail(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        return buildStaffOrderDetailResponse(order);
    }

    @Override
    @Transactional
    public StaffOrderDetailResponse confirmOrder(Long orderId, ConfirmOrderRequest request, Long staffId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalArgumentException("Chỉ đơn hàng đang ở trạng thái PENDING (chờ xác nhận) mới có thể xác nhận");
        }

        String pkgName = request.getPackageName().trim();
        DeliveryPackage deliveryPackage;

        if (Boolean.TRUE.equals(request.getIsNewPackage())) {
            if (deliveryPackageRepository.existsByPackageName(pkgName)) {
                throw new ConflictException("Gói hàng '" + pkgName + "' đã tồn tại trong hệ thống");
            }
            int maxOrders = getMaxOrdersPerPackage();
            deliveryPackage = DeliveryPackage.builder()
                    .packageName(pkgName)
                    .status("PENDING")
                    .maxOrders(maxOrders)
                    .build();
            deliveryPackage = deliveryPackageRepository.save(deliveryPackage);
            log.info("Tạo gói hàng mới khi xác nhận đơn: packageId={}, packageName={}", deliveryPackage.getId(), pkgName);
        } else {
            deliveryPackage = deliveryPackageRepository.findByPackageName(pkgName)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói hàng '" + pkgName + "'"));

            if (!"PENDING".equalsIgnoreCase(deliveryPackage.getStatus())) {
                throw new IllegalArgumentException("Chỉ được gộp đơn vào gói hàng chưa giao (trạng thái PENDING)");
            }

            long currentOrders = orderRepository.countByDeliveryPackageId(deliveryPackage.getId());
            if (currentOrders >= deliveryPackage.getMaxOrders()) {
                throw new IllegalArgumentException("Gói hàng '" + pkgName + "' đã đầy (" + deliveryPackage.getMaxOrders() + " đơn)");
            }
        }

        User staffUser = staffId != null ? userRepository.findById(staffId).orElse(null) : null;

        order.setDeliveryPackage(deliveryPackage);
        order.setStatus("CONFIRMED");
        Order savedOrder = orderRepository.save(order);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(savedOrder)
                .status("CONFIRMED")
                .note("Nhân viên xác nhận và gán vào gói " + deliveryPackage.getPackageName())
                .changedBy(staffUser)
                .build();
        orderStatusHistoryRepository.save(history);

        log.info("Staff đã xác nhận đơn hàng thành công: orderId={}, orderCode={}, package={}",
                savedOrder.getId(), savedOrder.getOrderCode(), deliveryPackage.getPackageName());

        return buildStaffOrderDetailResponse(savedOrder);
    }

    @Override
    @Transactional
    public StaffOrderDetailResponse cancelOrderByStaff(Long orderId, CancelOrderRequest request, Long staffId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalArgumentException("Chỉ đơn hàng đang ở trạng thái PENDING mới có thể hủy");
        }

        User staffUser = staffId != null ? userRepository.findById(staffId).orElse(null) : null;

        order.setStatus("CANCELLED");
        Order savedOrder = orderRepository.save(order);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(savedOrder)
                .status("CANCELLED")
                .note("Nhân viên hủy đơn: " + request.getReason().trim())
                .changedBy(staffUser)
                .build();
        orderStatusHistoryRepository.save(history);

        // 1. Hoàn tồn kho sản phẩm
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() != null) {
                    Product product = productRepository.findByIdWithLock(item.getProduct().getId()).orElse(null);
                    if (product != null) {
                        int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                        product.setStockQuantity(product.getStockQuantity() + qty);
                        int currentSold = product.getSoldCount() != null ? product.getSoldCount() : 0;
                        product.setSoldCount(Math.max(0, currentSold - qty));
                        productRepository.save(product);
                    }
                }
            }
        }

        // 2. Hoàn lại lượt sử dụng voucher (nếu có)
        voucherService.revertVoucherUsage(order);

        log.info("Nhân viên hủy đơn hàng: orderId={}, orderCode={}, lý do='{}'",
                orderId, order.getOrderCode(), request.getReason().trim());

        return buildStaffOrderDetailResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeliveryPackageResponse> getOpenPackages() {
        List<DeliveryPackage> openPackages = deliveryPackageRepository.findByStatusOrderByCreatedAtDesc("PENDING");
        List<DeliveryPackageResponse> responses = new ArrayList<>();

        for (DeliveryPackage pkg : openPackages) {
            List<Order> ordersInPkg = orderRepository.findByDeliveryPackageIdOrderByCreatedAtAsc(pkg.getId());
            List<String> orderCodes = ordersInPkg.stream().map(Order::getOrderCode).toList();
            responses.add(DeliveryPackageResponse.fromEntity(pkg, orderCodes));
        }

        return responses;
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private StaffOrderDetailResponse buildStaffOrderDetailResponse(Order order) {
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            List<Long> productIds = order.getItems().stream()
                    .map(item -> item.getProduct() != null ? item.getProduct().getId() : null)
                    .filter(Objects::nonNull)
                    .toList();
            Map<Long, String> thumbnailMap = loadThumbnailMap(productIds);

            itemResponses = order.getItems().stream()
                    .map(item -> {
                        Product p = item.getProduct();
                        String thumbnail = (p != null) ? thumbnailMap.get(p.getId()) : null;
                        return OrderItemResponse.fromEntity(item, thumbnail);
                    })
                    .toList();
        }

        List<OrderStatusHistoryResponse> historyResponses = orderStatusHistoryRepository
                .findByOrderIdOrderByCreatedAtAsc(order.getId())
                .stream()
                .map(OrderStatusHistoryResponse::fromEntity)
                .toList();

        VoucherClientResponse productVoucherResp = (order.getProductVoucher() != null)
                ? VoucherClientResponse.fromEntity(order.getProductVoucher(), true, null)
                : null;

        VoucherClientResponse shippingVoucherResp = (order.getShippingVoucher() != null)
                ? VoucherClientResponse.fromEntity(order.getShippingVoucher(), true, null)
                : null;

        return StaffOrderDetailResponse.fromEntity(
                order,
                itemResponses,
                historyResponses,
                productVoucherResp,
                shippingVoucherResp
        );
    }

    private Map<Long, String> loadThumbnailMap(List<Long> productIds) {
        if (productIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ProductImage> images = productImageRepository.findByProductIdInOrderByPriority(productIds);
        Map<Long, String> map = new HashMap<>();
        for (ProductImage img : images) {
            map.putIfAbsent(img.getProduct().getId(), img.getImageUrl());
        }
        return map;
    }

    private int getMaxOrdersPerPackage() {
        return systemSettingRepository.findBySettingKey("MAX_ORDERS_PER_PACKAGE")
                .map(setting -> {
                    try {
                        return Integer.parseInt(setting.getSettingValue().trim());
                    } catch (Exception e) {
                        return 7;
                    }
                })
                .orElse(7);
    }
}
