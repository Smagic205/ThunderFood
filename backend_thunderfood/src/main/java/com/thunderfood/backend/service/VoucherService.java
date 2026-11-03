package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.voucher.*;
import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.entity.Voucher;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface VoucherService {

    // Admin Operations
    PageResponse<VoucherAdminResponse> getAllVouchersForAdmin(
            String keyword,
            String voucherType,
            String status,
            Pageable pageable
    );

    VoucherAdminResponse getVoucherById(Long id);

    VoucherAdminResponse createVoucher(VoucherRequest request);

    VoucherAdminResponse updateVoucher(Long id, VoucherRequest request);

    VoucherAdminResponse toggleVoucherStatus(Long id);

    void deleteVoucher(Long id);

    // Customer / Client Operations
    List<VoucherClientResponse> getAvailableVouchersForCustomer(Long userId, BigDecimal currentSubtotal);

    VoucherCheckResponse checkVoucherEligibility(
            String code,
            Long userId,
            BigDecimal subtotalAmount,
            BigDecimal shippingFee
    );

    BigDecimal calculateDiscount(Voucher voucher, BigDecimal subtotal, BigDecimal shippingFee);

    void recordVoucherUsage(Voucher voucher, User user, Order order, BigDecimal discountAmount);

    void revertVoucherUsage(Order order);
}
