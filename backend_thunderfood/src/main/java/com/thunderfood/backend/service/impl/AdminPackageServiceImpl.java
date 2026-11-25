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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

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
        List<DeliveryPackage> packages = deliveryPackageRepository.findAll();

        return packages.stream()
                .filter(p -> {
                    if (!DateRangeUtils.isWithinRange(p.getCreatedAt(), startDate, endDate)) {
                        return false;
                    }
                    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim())) {
                        String filterStatus = status.trim().toUpperCase();
                        String actualStatus = "PENDING".equalsIgnoreCase(p.getStatus()) ? "UNASSIGNED" : p.getStatus().toUpperCase();
                        if (!filterStatus.equals(actualStatus) && !filterStatus.equals(p.getStatus().toUpperCase())) {
                            return false;
                        }
                    }
                    return true;
                })
                .sorted((a, b) -> {
                    LocalDateTime t1 = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN;
                    LocalDateTime t2 = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN;
                    return t2.compareTo(t1);
                })
                .map(this::mapToAdminPackageResponse)
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
