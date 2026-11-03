package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.voucher.*;
import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.entity.Voucher;
import com.thunderfood.backend.entity.VoucherUsage;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.VoucherRepository;
import com.thunderfood.backend.repository.VoucherUsageRepository;
import com.thunderfood.backend.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
    private final VoucherUsageRepository voucherUsageRepository;

    // =========================================================================
    // ADMIN OPERATIONS
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<VoucherAdminResponse> getAllVouchersForAdmin(
            String keyword,
            String voucherType,
            String status,
            Pageable pageable
    ) {
        String cleanKeyword = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        String cleanType = (voucherType != null && !voucherType.isBlank()) ? voucherType.trim().toUpperCase() : null;

        Boolean isActiveFilter = null;
        if ("INACTIVE".equalsIgnoreCase(status)) {
            isActiveFilter = false;
        } else if ("ACTIVE".equalsIgnoreCase(status) || "UPCOMING".equalsIgnoreCase(status) || "EXPIRED".equalsIgnoreCase(status) || "DEPLETED".equalsIgnoreCase(status)) {
            isActiveFilter = true;
        }

        Page<Voucher> voucherPage = voucherRepository.findAllWithFilters(cleanKeyword, cleanType, isActiveFilter, pageable);

        List<VoucherAdminResponse> items;
        long totalElements;
        int totalPages;

        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status) && !"INACTIVE".equalsIgnoreCase(status)) {
            items = voucherPage.getContent().stream()
                    .map(VoucherAdminResponse::fromEntity)
                    .filter(res -> status.equalsIgnoreCase(res.getStatus()))
                    .toList();
            totalElements = items.size();
            totalPages = totalElements == 0 ? 0 : 1;
        } else {
            items = voucherPage.getContent().stream()
                    .map(VoucherAdminResponse::fromEntity)
                    .toList();
            totalElements = voucherPage.getTotalElements();
            totalPages = voucherPage.getTotalPages();
        }

        PaginationInfo pagination = PaginationInfo.builder()
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .totalElements(totalElements)
                .totalPages(totalPages)
                .hasNext(pageable.getPageNumber() + 1 < totalPages)
                .hasPrevious(pageable.getPageNumber() > 0)
                .build();

        return PageResponse.<VoucherAdminResponse>builder()
                .content(items)
                .pagination(pagination)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherAdminResponse getVoucherById(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với ID: " + id));
        return VoucherAdminResponse.fromEntity(voucher);
    }

    @Override
    @Transactional
    public VoucherAdminResponse createVoucher(VoucherRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase();

        if (voucherRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new IllegalArgumentException("Mã voucher '" + normalizedCode + "' đã tồn tại trên hệ thống");
        }

        validateVoucherBusinessRules(request);

        Voucher voucher = Voucher.builder()
                .code(normalizedCode)
                .name(request.getName().trim())
                .description(request.getDescription())
                .voucherType(request.getVoucherType().trim().toUpperCase())
                .discountType(request.getDiscountType().trim().toUpperCase())
                .discountValue(request.getDiscountValue())
                .minOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO)
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .usageLimit(request.getUsageLimit())
                .usageLimitPerUser(request.getUsageLimitPerUser() != null ? request.getUsageLimitPerUser() : 1)
                .usedCount(0)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        Voucher saved = voucherRepository.save(voucher);
        log.info("Tạo voucher mới thành công: id={}, code={}, type={}", saved.getId(), saved.getCode(), saved.getVoucherType());
        return VoucherAdminResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public VoucherAdminResponse updateVoucher(Long id, VoucherRequest request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với ID: " + id));

        String normalizedCode = request.getCode().trim().toUpperCase();

        if (voucherRepository.existsByCodeIgnoreCaseAndIdNot(normalizedCode, id)) {
            throw new IllegalArgumentException("Mã voucher '" + normalizedCode + "' đã tồn tại trên một voucher khác");
        }

        // Kiểm tra tính toàn vẹn nếu voucher đã phát sinh lượt sử dụng
        if (voucher.getUsedCount() != null && voucher.getUsedCount() > 0) {
            if (!voucher.getCode().equalsIgnoreCase(normalizedCode)) {
                throw new IllegalArgumentException("Voucher đã có lượt sử dụng (" + voucher.getUsedCount() + " lượt), không được phép sửa mã code");
            }
            if (!voucher.getVoucherType().equalsIgnoreCase(request.getVoucherType().trim())) {
                throw new IllegalArgumentException("Voucher đã có lượt sử dụng, không được phép thay đổi loại voucher");
            }
            if (!voucher.getDiscountType().equalsIgnoreCase(request.getDiscountType().trim())) {
                throw new IllegalArgumentException("Voucher đã có lượt sử dụng, không được phép thay đổi hình thức giảm giá");
            }
            if (voucher.getDiscountValue().compareTo(request.getDiscountValue()) != 0) {
                throw new IllegalArgumentException("Voucher đã có lượt sử dụng, không được phép thay đổi giá trị giảm giá");
            }
        }

        if (request.getUsageLimit() != null && voucher.getUsedCount() != null && request.getUsageLimit() < voucher.getUsedCount()) {
            throw new IllegalArgumentException("Tổng lượt sử dụng mới (" + request.getUsageLimit() + 
                    ") không được nhỏ hơn số lượt đã dùng hiện tại (" + voucher.getUsedCount() + ")");
        }

        validateVoucherBusinessRules(request);

        voucher.setCode(normalizedCode);
        voucher.setName(request.getName().trim());
        voucher.setDescription(request.getDescription());
        voucher.setVoucherType(request.getVoucherType().trim().toUpperCase());
        voucher.setDiscountType(request.getDiscountType().trim().toUpperCase());
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMinOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO);
        voucher.setMaxDiscountAmount(request.getMaxDiscountAmount());
        voucher.setUsageLimit(request.getUsageLimit());
        voucher.setUsageLimitPerUser(request.getUsageLimitPerUser() != null ? request.getUsageLimitPerUser() : 1);
        voucher.setStartDate(request.getStartDate());
        voucher.setEndDate(request.getEndDate());
        if (request.getIsActive() != null) {
            voucher.setIsActive(request.getIsActive());
        }

        Voucher updated = voucherRepository.save(voucher);
        log.info("Cập nhật voucher thành công: id={}, code={}", updated.getId(), updated.getCode());
        return VoucherAdminResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public VoucherAdminResponse toggleVoucherStatus(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với ID: " + id));

        boolean newStatus = !Boolean.TRUE.equals(voucher.getIsActive());
        voucher.setIsActive(newStatus);
        Voucher updated = voucherRepository.save(voucher);
        log.info("Chuyển trạng thái voucher id={} thành isActive={}", id, newStatus);
        return VoucherAdminResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với ID: " + id));

        // Nếu đã có lượt sử dụng trong hệ thống -> Soft delete (chuyển isActive = false)
        if (voucher.getUsedCount() != null && voucher.getUsedCount() > 0) {
            voucher.setIsActive(false);
            voucherRepository.save(voucher);
            log.info("Voucher id={} đã có {} lượt dùng, thực hiện vô hiệu hóa (soft delete)", id, voucher.getUsedCount());
        } else {
            voucherRepository.delete(voucher);
            log.info("Đã xóa hoàn toàn voucher chưa sử dụng: id={}", id);
        }
    }

    // =========================================================================
    // CUSTOMER / CLIENT OPERATIONS
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public List<VoucherClientResponse> getAvailableVouchersForCustomer(Long userId, BigDecimal currentSubtotal) {
        LocalDateTime now = LocalDateTime.now();
        List<Voucher> availableVouchers = voucherRepository.findAvailableVouchers(now);
        BigDecimal subtotal = (currentSubtotal != null) ? currentSubtotal : BigDecimal.ZERO;

        return availableVouchers.stream().map(voucher -> {
            boolean eligible = true;
            String reason = null;

            if (subtotal.compareTo(voucher.getMinOrderAmount()) < 0) {
                eligible = false;
                reason = "Đơn hàng tối thiểu " + formatMoney(voucher.getMinOrderAmount());
            }

            if (eligible && userId != null && voucher.getUsageLimitPerUser() != null) {
                long userUsed = voucherUsageRepository.countByVoucherIdAndUserIdAndIsRevertedFalse(voucher.getId(), userId);
                if (userUsed >= voucher.getUsageLimitPerUser()) {
                    eligible = false;
                    reason = "Bạn đã đạt giới hạn sử dụng mã này (" + voucher.getUsageLimitPerUser() + " lượt)";
                }
            }

            return VoucherClientResponse.fromEntity(voucher, eligible, reason);
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherCheckResponse checkVoucherEligibility(
            String code,
            Long userId,
            BigDecimal subtotalAmount,
            BigDecimal shippingFee
    ) {
        BigDecimal subtotal = (subtotalAmount != null) ? subtotalAmount : BigDecimal.ZERO;
        BigDecimal shipFee = (shippingFee != null) ? shippingFee : BigDecimal.ZERO;

        if (code == null || code.isBlank()) {
            return buildErrorResponse("Mã voucher không được để trống", subtotal, shipFee);
        }

        String normalizedCode = code.trim().toUpperCase();
        Voucher voucher = voucherRepository.findByCodeIgnoreCase(normalizedCode).orElse(null);

        if (voucher == null) {
            return buildErrorResponse("Mã giảm giá '" + normalizedCode + "' không tồn tại", subtotal, shipFee);
        }

        LocalDateTime now = LocalDateTime.now();

        if (Boolean.FALSE.equals(voucher.getIsActive())) {
            return buildErrorResponse("Mã giảm giá hiện đang tạm ngưng áp dụng", subtotal, shipFee, voucher);
        }

        if (voucher.isUpcoming(now)) {
            return buildErrorResponse("Mã giảm giá chưa đến thời gian áp dụng", subtotal, shipFee, voucher);
        }

        if (voucher.isExpired(now)) {
            return buildErrorResponse("Mã giảm giá đã hết hạn sử dụng", subtotal, shipFee, voucher);
        }

        if (voucher.isDepleted()) {
            return buildErrorResponse("Mã giảm giá đã hết lượt sử dụng", subtotal, shipFee, voucher);
        }

        if (userId != null && voucher.getUsageLimitPerUser() != null) {
            long userUsed = voucherUsageRepository.countByVoucherIdAndUserIdAndIsRevertedFalse(voucher.getId(), userId);
            if (userUsed >= voucher.getUsageLimitPerUser()) {
                return buildErrorResponse("Bạn đã dùng hết số lượt cho phép của mã này (" + 
                        voucher.getUsageLimitPerUser() + " lượt/khách)", subtotal, shipFee, voucher);
            }
        }

        if (subtotal.compareTo(voucher.getMinOrderAmount()) < 0) {
            return buildErrorResponse("Đơn hàng chưa đạt giá trị tối thiểu " + 
                    formatMoney(voucher.getMinOrderAmount()) + " để áp dụng mã này", subtotal, shipFee, voucher);
        }

        // Tính toán mức giảm
        BigDecimal discountAmount = calculateDiscount(voucher, subtotal, shipFee);
        BigDecimal finalSubtotal = subtotal;
        BigDecimal finalShippingFee = shipFee;

        if (voucher.isProductVoucher()) {
            finalSubtotal = subtotal.subtract(discountAmount).max(BigDecimal.ZERO);
        } else if (voucher.isShippingVoucher()) {
            finalShippingFee = shipFee.subtract(discountAmount).max(BigDecimal.ZERO);
        }

        return VoucherCheckResponse.builder()
                .valid(true)
                .message("Áp dụng mã giảm giá thành công")
                .voucherType(voucher.getVoucherType())
                .discountAmount(discountAmount)
                .finalSubtotal(finalSubtotal)
                .finalShippingFee(finalShippingFee)
                .voucher(VoucherClientResponse.fromEntity(voucher, true, null))
                .build();
    }

    @Override
    public BigDecimal calculateDiscount(Voucher voucher, BigDecimal subtotal, BigDecimal shippingFee) {
        BigDecimal baseAmount = voucher.isShippingVoucher() ? shippingFee : subtotal;
        if (baseAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount;
        if (voucher.isPercentDiscount()) {
            // rawDiscount = baseAmount * (discountValue / 100)
            BigDecimal rawDiscount = baseAmount.multiply(voucher.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            if (voucher.getMaxDiscountAmount() != null && voucher.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                discount = rawDiscount.min(voucher.getMaxDiscountAmount());
            } else {
                discount = rawDiscount;
            }
        } else {
            // FIXED_AMOUNT
            discount = voucher.getDiscountValue();
        }

        // Giảm tối đa không vượt quá giá trị ban đầu
        return discount.min(baseAmount).max(BigDecimal.ZERO);
    }

    @Override
    @Transactional
    public void recordVoucherUsage(Voucher voucher, User user, Order order, BigDecimal discountAmount) {
        if (voucher == null || user == null) {
            return;
        }

        int currentUsed = (voucher.getUsedCount() != null) ? voucher.getUsedCount() : 0;
        voucher.setUsedCount(currentUsed + 1);
        voucherRepository.save(voucher);

        VoucherUsage usage = VoucherUsage.builder()
                .voucher(voucher)
                .user(user)
                .order(order)
                .discountAmount(discountAmount != null ? discountAmount : BigDecimal.ZERO)
                .isReverted(false)
                .build();

        voucherUsageRepository.save(usage);
        log.info("Ghi nhận lượt sử dụng voucher: voucherId={}, userId={}, orderId={}, discount={}", 
                voucher.getId(), user.getId(), (order != null ? order.getId() : null), discountAmount);
    }

    @Override
    @Transactional
    public void revertVoucherUsage(Order order) {
        if (order == null || order.getId() == null) {
            return;
        }

        List<VoucherUsage> usages = voucherUsageRepository.findByOrderId(order.getId());
        for (VoucherUsage usage : usages) {
            if (Boolean.FALSE.equals(usage.getIsReverted())) {
                usage.setIsReverted(true);
                voucherUsageRepository.save(usage);

                Voucher voucher = usage.getVoucher();
                if (voucher != null && voucher.getUsedCount() != null && voucher.getUsedCount() > 0) {
                    voucher.setUsedCount(voucher.getUsedCount() - 1);
                    voucherRepository.save(voucher);
                    log.info("Hoàn trả 1 lượt dùng cho voucher id={}, mã={}", voucher.getId(), voucher.getCode());
                }
            }
        }
    }

    // =========================================================================
    // PRIVATE VALIDATIONS & HELPERS
    // =========================================================================

    private void validateVoucherBusinessRules(VoucherRequest request) {
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("Thời gian bắt đầu (" + request.getStartDate() + 
                    ") phải trước thời gian kết thúc (" + request.getEndDate() + ")");
        }

        String discountType = request.getDiscountType().trim().toUpperCase();
        BigDecimal discountValue = request.getDiscountValue();

        if ("PERCENT".equals(discountType)) {
            if (discountValue.compareTo(BigDecimal.ONE) < 0 || discountValue.compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new IllegalArgumentException("Mức giảm theo phần trăm phải nằm trong khoảng từ 1% đến 100%");
            }
            if (request.getMaxDiscountAmount() != null && request.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Mức giảm tối đa (nếu có) phải lớn hơn 0");
            }
        } else if ("FIXED_AMOUNT".equals(discountType)) {
            if (discountValue.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Mức giảm bằng số tiền cố định phải lớn hơn 0");
            }
        }

        if (request.getMinOrderAmount() != null && request.getMinOrderAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Giá trị đơn hàng tối thiểu không được âm");
        }
    }

    private VoucherCheckResponse buildErrorResponse(String message, BigDecimal subtotal, BigDecimal shippingFee) {
        return buildErrorResponse(message, subtotal, shippingFee, null);
    }

    private VoucherCheckResponse buildErrorResponse(String message, BigDecimal subtotal, BigDecimal shippingFee, Voucher voucher) {
        return VoucherCheckResponse.builder()
                .valid(false)
                .message(message)
                .voucherType(voucher != null ? voucher.getVoucherType() : null)
                .discountAmount(BigDecimal.ZERO)
                .finalSubtotal(subtotal)
                .finalShippingFee(shippingFee)
                .voucher(voucher != null ? VoucherClientResponse.fromEntity(voucher, false, message) : null)
                .build();
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0đ";
        return String.format("%,dđ", amount.longValue());
    }
}

