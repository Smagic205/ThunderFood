package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.dto.dashboard.DashboardSummaryResponse;
import com.thunderfood.backend.dto.dashboard.RevenueChartPoint;
import com.thunderfood.backend.dto.dashboard.ShipperPerformanceResponse;
import com.thunderfood.backend.dto.dashboard.TopProductResponse;
import com.thunderfood.backend.entity.DeliveryPackage;
import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.repository.DeliveryPackageRepository;
import com.thunderfood.backend.repository.OrderItemRepository;
import com.thunderfood.backend.repository.OrderRepository;
import com.thunderfood.backend.repository.UserRepository;
import com.thunderfood.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardServiceImpl implements DashboardService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final DeliveryPackageRepository deliveryPackageRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(String period, LocalDate customStart, LocalDate customEnd) {
        LocalDateTime start;
        LocalDateTime end;
        LocalDateTime prevStart;
        LocalDateTime prevEnd;

        LocalDate today = LocalDate.now();

        if ("TODAY".equalsIgnoreCase(period)) {
            start = today.atStartOfDay();
            end = today.atTime(LocalTime.MAX);
            prevStart = today.minusDays(1).atStartOfDay();
            prevEnd = today.minusDays(1).atTime(LocalTime.MAX);
        } else if ("THIS_YEAR".equalsIgnoreCase(period)) {
            start = today.withDayOfYear(1).atStartOfDay();
            end = today.atTime(LocalTime.MAX);
            prevStart = today.minusYears(1).withDayOfYear(1).atStartOfDay();
            prevEnd = today.minusYears(1).withDayOfYear(today.minusYears(1).lengthOfYear()).atTime(LocalTime.MAX);
        } else if (customStart != null && customEnd != null) {
            start = customStart.atStartOfDay();
            end = customEnd.atTime(LocalTime.MAX);
            long days = Duration.between(start, end).toDays() + 1;
            prevStart = start.minusDays(days);
            prevEnd = end.minusDays(days);
        } else {
            // Mặc định: THIS_MONTH
            start = today.withDayOfMonth(1).atStartOfDay();
            end = today.atTime(LocalTime.MAX);
            LocalDate prevMonthDate = today.minusMonths(1);
            prevStart = prevMonthDate.withDayOfMonth(1).atStartOfDay();
            prevEnd = prevMonthDate.withDayOfMonth(prevMonthDate.lengthOfMonth()).atTime(LocalTime.MAX);
        }

        BigDecimal currentRevenue = orderRepository.calculateTotalRevenue(start, end);
        BigDecimal previousRevenue = orderRepository.calculateTotalRevenue(prevStart, prevEnd);

        Double growthRate = calculateGrowthRate(currentRevenue, previousRevenue);

        List<Object[]> statusCounts = orderRepository.countOrdersByStatus(start, end);
        Map<String, Long> statusMap = new HashMap<>();
        long totalOrders = 0;
        for (Object[] row : statusCounts) {
            String status = (String) row[0];
            Long count = (Long) row[1];
            statusMap.put(status, count);
            totalOrders += count;
        }

        long newCustomers = userRepository.countByCreatedAtBetween(start, end);

        return DashboardSummaryResponse.builder()
                .totalRevenue(currentRevenue)
                .previousRevenue(previousRevenue)
                .revenueGrowthRate(growthRate)
                .totalOrders(totalOrders)
                .pendingOrders(statusMap.getOrDefault("PENDING", 0L))
                .confirmedOrders(statusMap.getOrDefault("CONFIRMED", 0L))
                .deliveringOrders(statusMap.getOrDefault("DELIVERING", 0L))
                .deliveredOrders(statusMap.getOrDefault("DELIVERED", 0L))
                .cancelledOrders(statusMap.getOrDefault("CANCELLED", 0L))
                .newCustomersCount(newCustomers)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RevenueChartPoint> getRevenueChart(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(14);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<Order> deliveredOrders = orderRepository.findByStatusAndCreatedAtBetweenOrderByCreatedAtAsc("DELIVERED", start, end);

        Map<String, List<Order>> ordersByDate = deliveredOrders.stream()
                .collect(Collectors.groupingBy(o -> o.getCreatedAt().toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE)));

        List<RevenueChartPoint> points = new ArrayList<>();
        LocalDate cur = startDate;
        while (!cur.isAfter(endDate)) {
            String key = cur.format(DateTimeFormatter.ISO_LOCAL_DATE);
            List<Order> dayOrders = ordersByDate.getOrDefault(key, Collections.emptyList());

            BigDecimal dayRevenue = dayOrders.stream()
                    .map(Order::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            points.add(RevenueChartPoint.builder()
                    .label(key)
                    .revenue(dayRevenue)
                    .orderCount(dayOrders.size())
                    .build());

            cur = cur.plusDays(1);
        }

        return points;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopProductResponse> getTopProducts(LocalDate startDate, LocalDate endDate, int limit) {
        if (startDate == null) {
            startDate = LocalDate.now().minusMonths(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        if (limit <= 0) {
            limit = 10;
        }

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<Object[]> rawList = orderItemRepository.findTopSellingProducts(start, end, PageRequest.of(0, limit));

        List<TopProductResponse> result = new ArrayList<>();
        for (Object[] row : rawList) {
            Long productId = (Long) row[0];
            String productName = (String) row[1];
            String categoryName = (String) row[2];
            Long soldQty = (Long) row[3];
            BigDecimal revenue = (BigDecimal) row[4];

            result.add(TopProductResponse.builder()
                    .productId(productId)
                    .productName(productName)
                    .categoryName(categoryName)
                    .soldQuantity(soldQty)
                    .totalRevenue(revenue)
                    .build());
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShipperPerformanceResponse> getShipperPerformance(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) {
            startDate = LocalDate.now().minusMonths(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<DeliveryPackage> packages = deliveryPackageRepository.findByShippedByStaffIsNotNullAndCreatedAtBetween(start, end);

        Map<User, List<DeliveryPackage>> byStaff = packages.stream()
                .collect(Collectors.groupingBy(DeliveryPackage::getShippedByStaff));

        List<ShipperPerformanceResponse> list = new ArrayList<>();

        for (Map.Entry<User, List<DeliveryPackage>> entry : byStaff.entrySet()) {
            User staff = entry.getKey();
            List<DeliveryPackage> staffPackages = entry.getValue();

            int totalPackages = staffPackages.size();
            int totalOrders = 0;
            int deliveredOrders = 0;
            int failedOrders = 0;
            long totalMinutes = 0;
            int timedDeliveredCount = 0;

            for (DeliveryPackage dp : staffPackages) {
                List<Order> orders = orderRepository.findByDeliveryPackageId(dp.getId());
                totalOrders += orders.size();

                for (Order o : orders) {
                    if ("DELIVERED".equals(o.getStatus())) {
                        deliveredOrders++;
                        if (o.getDeliveredAt() != null && dp.getCreatedAt() != null) {
                            Duration diff = Duration.between(dp.getCreatedAt(), o.getDeliveredAt());
                            totalMinutes += Math.max(0, diff.toMinutes());
                            timedDeliveredCount++;
                        }
                    } else if ("CANCELLED".equals(o.getStatus())) {
                        failedOrders++;
                    }
                }
            }

            double successRate = totalOrders > 0
                    ? BigDecimal.valueOf((double) deliveredOrders * 100 / totalOrders).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            double avgMinutes = timedDeliveredCount > 0
                    ? BigDecimal.valueOf((double) totalMinutes / timedDeliveredCount).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            list.add(ShipperPerformanceResponse.builder()
                    .staffId(staff.getId())
                    .staffName(staff.getFullName())
                    .email(staff.getEmail())
                    .phone(staff.getPhone())
                    .totalPackages(totalPackages)
                    .totalOrders(totalOrders)
                    .deliveredOrders(deliveredOrders)
                    .failedOrders(failedOrders)
                    .successRate(successRate)
                    .avgDeliveryMinutes(avgMinutes)
                    .build());
        }

        list.sort(Comparator.comparingDouble(ShipperPerformanceResponse::getSuccessRate).reversed());
        return list;
    }

    private Double calculateGrowthRate(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return (current != null && current.compareTo(BigDecimal.ZERO) > 0) ? 100.0 : 0.0;
        }
        if (current == null) {
            current = BigDecimal.ZERO;
        }

        BigDecimal diff = current.subtract(previous);
        BigDecimal rate = diff.divide(previous, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        return rate.setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}

