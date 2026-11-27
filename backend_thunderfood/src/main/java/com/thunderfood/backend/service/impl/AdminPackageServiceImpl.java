package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.dto.admin.AdminPackageResponse;
import com.thunderfood.backend.entity.DeliveryPackage;
import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.DeliveryPackageRepository;
import com.thunderfood.backend.repository.OrderRepository;
import com.thunderfood.backend.repository.UserRepository;
import com.thunderfood.backend.service.AdminPackageService;
import com.thunderfood.backend.util.DateRangeUtils;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminPackageServiceImpl implements AdminPackageService {

    private final DeliveryPackageRepository deliveryPackageRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    @Transactional(readOnly = true)
    public List<AdminPackageResponse> getAllPackages(String status, LocalDate startDate, LocalDate endDate) {
        DateRangeUtils.validate(startDate, endDate);
        LocalDateTime start = DateRangeUtils.toStartOfDay(startDate);
        LocalDateTime end = DateRangeUtils.toEndOfDay(endDate);

        Specification<DeliveryPackage> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (start != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), start));
            }
            if (end != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), end));
            }
            if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim())) {
                String filterStatus = status.trim().toUpperCase(Locale.ROOT);
                if ("UNASSIGNED".equals(filterStatus) || "PENDING".equals(filterStatus)) {
                    predicates.add(cb.equal(cb.upper(root.get("status")), "PENDING"));
                } else {
                    predicates.add(cb.equal(cb.upper(root.get("status")), filterStatus));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<DeliveryPackage> packages = deliveryPackageRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (packages.isEmpty()) {
            return List.of();
        }

        List<Long> packageIds = packages.stream().map(DeliveryPackage::getId).toList();
        Map<Long, List<Order>> ordersByPackageId = orderRepository.findByDeliveryPackageIdInOrderByCreatedAtAsc(packageIds)
                .stream()
                .collect(Collectors.groupingBy(o -> o.getDeliveryPackage().getId()));

        return packages.stream()
                .map(pkg -> mapToAdminPackageResponse(pkg, ordersByPackageId.getOrDefault(pkg.getId(), Collections.emptyList())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminPackageResponse getPackageByCode(String code) {
        DeliveryPackage pkg = deliveryPackageRepository.findByPackageName(code)
                .orElseGet(() -> {
                    try {
                        Long id = Long.parseLong(code);
                        return deliveryPackageRepository.findById(id).orElse(null);
                    } catch (NumberFormatException e) {
                        return null;
                    }
                });

        if (pkg == null) {
            throw new ResourceNotFoundException("Không tìm thấy gói hàng với mã: " + code);
        }

        return mapToAdminPackageResponse(pkg);
    }

    @Override
    @Transactional
    public AdminPackageResponse assignStaff(Long packageId, Long staffId) {
        DeliveryPackage pkg = deliveryPackageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói hàng với ID: " + packageId));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + staffId));

        pkg.setShippedByStaff(staff);
        if ("PENDING".equalsIgnoreCase(pkg.getStatus())) {
            pkg.setStatus("DELIVERING");
        }
        DeliveryPackage savedPkg = deliveryPackageRepository.save(pkg);

        // Chuyển các đơn CONFIRMED trong gói sang DELIVERING
        List<Order> orders = orderRepository.findByDeliveryPackageId(packageId);
        for (Order o : orders) {
            if ("CONFIRMED".equalsIgnoreCase(o.getStatus())) {
                o.setStatus("DELIVERING");
                orderRepository.save(o);
            }
        }

        log.info("Admin gán nhân viên ID={} phụ trách gói ID={}", staffId, packageId);
        return mapToAdminPackageResponse(savedPkg);
    }

    @Override
    @Transactional
    public void deletePackage(Long packageId) {
        DeliveryPackage pkg = deliveryPackageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói hàng với ID: " + packageId));

        List<Order> orders = orderRepository.findByDeliveryPackageId(packageId);
        boolean hasActiveOrders = orders.stream()
                .anyMatch(o -> "DELIVERING".equalsIgnoreCase(o.getStatus()) || "DELIVERED".equalsIgnoreCase(o.getStatus()));

        if (hasActiveOrders) {
            throw new IllegalStateException("Không thể xóa gói hàng đang trong quá trình giao hoặc đã giao thành công");
        }

        for (Order o : orders) {
            o.setDeliveryPackage(null);
            orderRepository.save(o);
        }

        deliveryPackageRepository.delete(pkg);
        log.info("Admin xóa gói hàng ID={}", packageId);
    }

    private AdminPackageResponse mapToAdminPackageResponse(DeliveryPackage pkg) {
        List<Order> orders = orderRepository.findByDeliveryPackageIdOrderByCreatedAtAsc(pkg.getId());
        return mapToAdminPackageResponse(pkg, orders);
    }

    private AdminPackageResponse mapToAdminPackageResponse(DeliveryPackage pkg, List<Order> orders) {

        List<String> orderCodes = new ArrayList<>();
        List<AdminPackageResponse.PackageOrderItemDto> orderDtos = new ArrayList<>();

        if (orders != null) {
            for (Order o : orders) {
                orderCodes.add(o.getOrderCode());
                orderDtos.add(AdminPackageResponse.PackageOrderItemDto.builder()
                        .orderCode(o.getOrderCode())
                        .receiverName(o.getReceiverName())
                        .receiverPhone(o.getReceiverPhone())
                        .shippingAddress(o.getShippingAddress())
                        .totalAmount(o.getTotalAmount())
                        .status(o.getStatus())
                        .build());
            }
        }

        String displayStatus = "PENDING".equalsIgnoreCase(pkg.getStatus()) ? "UNASSIGNED" : pkg.getStatus();
        Long staffId = pkg.getShippedByStaff() != null ? pkg.getShippedByStaff().getId() : null;
        String staffName = pkg.getShippedByStaff() != null ? pkg.getShippedByStaff().getFullName() : null;
        String createdAt = pkg.getCreatedAt() != null ? pkg.getCreatedAt().format(DATE_FORMATTER) : null;

        return AdminPackageResponse.builder()
                .id(pkg.getId())
                .code(pkg.getPackageName())
                .status(displayStatus)
                .staffId(staffId)
                .staffName(staffName)
                .orderCodes(orderCodes)
                .orders(orderDtos)
                .createdAt(createdAt)
                .build();
    }
}
