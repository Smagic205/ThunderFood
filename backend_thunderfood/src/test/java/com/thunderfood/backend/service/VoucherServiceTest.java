package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.voucher.*;
import com.thunderfood.backend.entity.Order;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.entity.Voucher;
import com.thunderfood.backend.entity.VoucherUsage;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.VoucherRepository;
import com.thunderfood.backend.repository.VoucherUsageRepository;
import com.thunderfood.backend.service.impl.VoucherServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoucherServiceTest {

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private VoucherUsageRepository voucherUsageRepository;

    @InjectMocks
    private VoucherServiceImpl voucherService;

    private Voucher productVoucher;
    private Voucher shippingVoucher;
    private VoucherRequest validRequest;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        now = LocalDateTime.now();

        productVoucher = Voucher.builder()
                .id(1L)
                .code("THUNDER20")
                .name("Giảm 20% đơn từ 100k")
                .description("Ưu đãi đặc biệt giảm 20% tối đa 30.000đ")
                .voucherType("PRODUCT")
                .discountType("PERCENT")
                .discountValue(new BigDecimal("20.00"))
                .minOrderAmount(new BigDecimal("100000.00"))
                .maxDiscountAmount(new BigDecimal("30000.00"))
                .usageLimit(100)
                .usageLimitPerUser(1)
                .usedCount(5)
                .startDate(now.minusDays(2))
                .endDate(now.plusDays(5))
                .isActive(true)
                .createdAt(now.minusDays(2))
                .updatedAt(now.minusDays(2))
                .build();

        shippingVoucher = Voucher.builder()
                .id(2L)
                .code("FREESHIP")
                .name("Miễn phí giao hàng")
                .description("Giảm 15.000đ phí giao hàng")
                .voucherType("SHIPPING")
                .discountType("FIXED_AMOUNT")
                .discountValue(new BigDecimal("15000.00"))
                .minOrderAmount(new BigDecimal("50000.00"))
                .maxDiscountAmount(null)
                .usageLimit(50)
                .usageLimitPerUser(2)
                .usedCount(0)
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(3))
                .isActive(true)
                .createdAt(now.minusDays(1))
                .updatedAt(now.minusDays(1))
                .build();

        validRequest = VoucherRequest.builder()
                .code("NEWYEAR50")
                .name("Mừng năm mới giảm 50k")
                .description("Đơn từ 200k")
                .voucherType("PRODUCT")
                .discountType("FIXED_AMOUNT")
                .discountValue(new BigDecimal("50000.00"))
                .minOrderAmount(new BigDecimal("200000.00"))
                .maxDiscountAmount(null)
                .usageLimit(200)
                .usageLimitPerUser(1)
                .startDate(now.plusDays(1))
                .endDate(now.plusDays(10))
                .isActive(true)
                .build();
    }

    // =========================================================================
    // 1. ADMIN - GET & FILTER TESTS
    // =========================================================================

    @Test
    @DisplayName("getAllVouchersForAdmin trả về danh sách voucher có phân trang")
    void testGetAllVouchersForAdmin_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Voucher> paged = new PageImpl<>(List.of(productVoucher, shippingVoucher), pageable, 2);

        when(voucherRepository.findAllWithFilters(isNull(), isNull(), isNull(), eq(pageable)))
                .thenReturn(paged);

        com.thunderfood.backend.dto.common.PageResponse<VoucherAdminResponse> result = 
                voucherService.getAllVouchersForAdmin(null, null, "ALL", pageable);

        assertNotNull(result);
        assertEquals(2, result.getPagination().getTotalElements());
        assertEquals("THUNDER20", result.getContent().get(0).getCode());
        assertEquals("FREESHIP", result.getContent().get(1).getCode());
    }

    @Test
    @DisplayName("getAllVouchersForAdmin lọc đúng voucher theo trạng thái tính toán (ACTIVE/UPCOMING/EXPIRED)")
    void testGetAllVouchersForAdmin_WithComputedStatusFilter() {
        Pageable pageable = PageRequest.of(0, 10);
        // productVoucher có status ACTIVE (ngày trong khoảng), shippingVoucher cũng ACTIVE
        Page<Voucher> unpaged = new PageImpl<>(List.of(productVoucher, shippingVoucher));

        when(voucherRepository.findAllWithFilters(isNull(), isNull(), eq(true), eq(org.springframework.data.domain.Pageable.unpaged())))
                .thenReturn(unpaged);

        com.thunderfood.backend.dto.common.PageResponse<VoucherAdminResponse> result =
                voucherService.getAllVouchersForAdmin(null, null, "ACTIVE", pageable);

        assertNotNull(result);
        assertEquals(2, result.getPagination().getTotalElements());
        assertEquals(1, result.getPagination().getTotalPages());
        assertEquals(2, result.getContent().size());
    }

    @Test
    @DisplayName("getVoucherById trả về thông tin chi tiết voucher khi ID tồn tại")
    void testGetVoucherById_Success() {
        when(voucherRepository.findById(1L)).thenReturn(Optional.of(productVoucher));

        VoucherAdminResponse response = voucherService.getVoucherById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("THUNDER20", response.getCode());
        assertEquals("ACTIVE", response.getStatus());
    }

    @Test
    @DisplayName("getVoucherById ném ResourceNotFoundException khi ID không tồn tại")
    void testGetVoucherById_NotFound() {
        when(voucherRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> voucherService.getVoucherById(999L));
    }

    // =========================================================================
    // 2. ADMIN - CREATE VOUCHER TESTS
    // =========================================================================

    @Test
    @DisplayName("createVoucher thành công với hình thức FIXED_AMOUNT")
    void testCreateVoucher_FixedAmount_Success() {
        when(voucherRepository.existsByCodeIgnoreCase("NEWYEAR50")).thenReturn(false);
        when(voucherRepository.save(any(Voucher.class))).thenAnswer(invocation -> {
            Voucher v = invocation.getArgument(0);
            v.setId(10L);
            return v;
        });

        VoucherAdminResponse response = voucherService.createVoucher(validRequest);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("NEWYEAR50", response.getCode());
        assertEquals("PRODUCT", response.getVoucherType());
        assertEquals("FIXED_AMOUNT", response.getDiscountType());
        assertEquals(0, response.getUsedCount());
        verify(voucherRepository).save(any(Voucher.class));
    }

    @Test
    @DisplayName("createVoucher thành công với hình thức PERCENT")
    void testCreateVoucher_Percent_Success() {
        VoucherRequest percentRequest = VoucherRequest.builder()
                .code("FLASH15")
                .name("Flash sale 15%")
                .voucherType("SHIPPING")
                .discountType("PERCENT")
                .discountValue(new BigDecimal("15.00"))
                .minOrderAmount(BigDecimal.ZERO)
                .maxDiscountAmount(new BigDecimal("10000.00"))
                .startDate(now.plusHours(1))
                .endDate(now.plusDays(2))
                .isActive(true)
                .build();

        when(voucherRepository.existsByCodeIgnoreCase("FLASH15")).thenReturn(false);
        when(voucherRepository.save(any(Voucher.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VoucherAdminResponse response = voucherService.createVoucher(percentRequest);

        assertNotNull(response);
        assertEquals("FLASH15", response.getCode());
        assertEquals("SHIPPING", response.getVoucherType());
        assertEquals("PERCENT", response.getDiscountType());
    }

    @Test
    @DisplayName("createVoucher ném ngoại lệ khi trùng mã code")
    void testCreateVoucher_DuplicateCode() {
        when(voucherRepository.existsByCodeIgnoreCase("NEWYEAR50")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> voucherService.createVoucher(validRequest));

        assertTrue(ex.getMessage().contains("đã tồn tại"));
        verify(voucherRepository, never()).save(any());
    }

    @Test
    @DisplayName("createVoucher ném ngoại lệ khi startDate sau endDate")
    void testCreateVoucher_InvalidDates() {
        validRequest.setStartDate(now.plusDays(5));
        validRequest.setEndDate(now.plusDays(1));

        when(voucherRepository.existsByCodeIgnoreCase("NEWYEAR50")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> voucherService.createVoucher(validRequest));

        assertTrue(ex.getMessage().contains("phải trước thời gian kết thúc"));
    }

    @Test
    @DisplayName("createVoucher ném ngoại lệ khi PERCENT discountValue > 100")
    void testCreateVoucher_InvalidPercentDiscount() {
        validRequest.setDiscountType("PERCENT");
        validRequest.setDiscountValue(new BigDecimal("150.00")); // > 100%

        when(voucherRepository.existsByCodeIgnoreCase("NEWYEAR50")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> voucherService.createVoucher(validRequest));

        assertTrue(ex.getMessage().contains("từ 1% đến 100%"));
    }

    @Test
    @DisplayName("createVoucher ném ngoại lệ khi FIXED_AMOUNT <= 0")
    void testCreateVoucher_InvalidFixedDiscount() {
        validRequest.setDiscountType("FIXED_AMOUNT");
        validRequest.setDiscountValue(BigDecimal.ZERO);

        when(voucherRepository.existsByCodeIgnoreCase("NEWYEAR50")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> voucherService.createVoucher(validRequest));

        assertTrue(ex.getMessage().contains("phải lớn hơn 0"));
    }

    // =========================================================================
    // 3. ADMIN - UPDATE VOUCHER TESTS
    // =========================================================================

    @Test
    @DisplayName("updateVoucher thành công khi voucher chưa có lượt sử dụng nào")
    void testUpdateVoucher_Unused_Success() {
        when(voucherRepository.findById(2L)).thenReturn(Optional.of(shippingVoucher));
        when(voucherRepository.existsByCodeIgnoreCaseAndIdNot("FREESHIP_NEW", 2L)).thenReturn(false);
        when(voucherRepository.save(any(Voucher.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VoucherRequest updateRequest = VoucherRequest.builder()
                .code("FREESHIP_NEW")
                .name("Miễn phí ship nâng cấp")
                .voucherType("SHIPPING")
                .discountType("FIXED_AMOUNT")
                .discountValue(new BigDecimal("20000.00"))
                .minOrderAmount(new BigDecimal("60000.00"))
                .startDate(now)
                .endDate(now.plusDays(5))
                .isActive(true)
                .build();

        VoucherAdminResponse response = voucherService.updateVoucher(2L, updateRequest);

        assertNotNull(response);
        assertEquals("FREESHIP_NEW", response.getCode());
        assertEquals(new BigDecimal("20000.00"), response.getDiscountValue());
    }

    @Test
    @DisplayName("updateVoucher cấm sửa code và giá trị giảm khi voucher đã có lượt dùng")
    void testUpdateVoucher_AlreadyUsed_PreventCriticalFieldChanges() {
        when(voucherRepository.findById(1L)).thenReturn(Optional.of(productVoucher)); // usedCount = 5

        VoucherRequest updateRequest = VoucherRequest.builder()
                .code("THUNDER_DIFF") // cố tình đổi code
                .name("Giảm giá mới")
                .voucherType("PRODUCT")
                .discountType("PERCENT")
                .discountValue(new BigDecimal("20.00"))
                .startDate(now)
                .endDate(now.plusDays(5))
                .build();

        when(voucherRepository.existsByCodeIgnoreCaseAndIdNot("THUNDER_DIFF", 1L)).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> voucherService.updateVoucher(1L, updateRequest));

        assertTrue(ex.getMessage().contains("không được phép sửa mã code"));
    }

    @Test
    @DisplayName("updateVoucher ném ngoại lệ khi usageLimit mới nhỏ hơn usedCount hiện tại")
    void testUpdateVoucher_UsageLimitLessThanUsedCount() {
        when(voucherRepository.findById(1L)).thenReturn(Optional.of(productVoucher)); // usedCount = 5

        VoucherRequest updateRequest = VoucherRequest.builder()
                .code("THUNDER20")
                .name("Giảm 20% đơn từ 100k")
                .voucherType("PRODUCT")
                .discountType("PERCENT")
                .discountValue(new BigDecimal("20.00"))
                .usageLimit(3) // < usedCount (5)
                .startDate(now.minusDays(2))
                .endDate(now.plusDays(5))
                .build();

        when(voucherRepository.existsByCodeIgnoreCaseAndIdNot("THUNDER20", 1L)).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> voucherService.updateVoucher(1L, updateRequest));

        assertTrue(ex.getMessage().contains("không được nhỏ hơn số lượt đã dùng"));
    }

    // =========================================================================
    // 4. ADMIN - TOGGLE STATUS & DELETE TESTS
    // =========================================================================

    @Test
    @DisplayName("toggleVoucherStatus chuyển trạng thái isActive từ true sang false và ngược lại")
    void testToggleVoucherStatus() {
        when(voucherRepository.findById(1L)).thenReturn(Optional.of(productVoucher));
        when(voucherRepository.save(any(Voucher.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VoucherAdminResponse response1 = voucherService.toggleVoucherStatus(1L);
        assertFalse(response1.getIsActive());

        VoucherAdminResponse response2 = voucherService.toggleVoucherStatus(1L);
        assertTrue(response2.getIsActive());
    }

    @Test
    @DisplayName("deleteVoucher thực hiện hard delete khi voucher chưa từng được dùng")
    void testDeleteVoucher_Unused_HardDelete() {
        when(voucherRepository.findById(2L)).thenReturn(Optional.of(shippingVoucher)); // usedCount = 0

        voucherService.deleteVoucher(2L);

        verify(voucherRepository).delete(shippingVoucher);
        verify(voucherRepository, never()).save(any());
    }

    @Test
    @DisplayName("deleteVoucher thực hiện soft delete (isActive = false) khi voucher đã có lượt dùng")
    void testDeleteVoucher_Used_SoftDelete() {
        when(voucherRepository.findById(1L)).thenReturn(Optional.of(productVoucher)); // usedCount = 5

        voucherService.deleteVoucher(1L);

        assertFalse(productVoucher.getIsActive());
        verify(voucherRepository).save(productVoucher);
        verify(voucherRepository, never()).delete(any());
    }

    // =========================================================================
    // 5. CLIENT - AVAILABLE VOUCHERS & ELIGIBILITY TESTS
    // =========================================================================

    @Test
    @DisplayName("getAvailableVouchersForCustomer đánh dấu đủ điều kiện dựa trên giá trị đơn và lượt dùng")
    void testGetAvailableVouchersForCustomer() {
        when(voucherRepository.findAvailableVouchers(any(LocalDateTime.class)))
                .thenReturn(List.of(productVoucher, shippingVoucher));

        when(voucherUsageRepository.countByVoucherIdAndUserIdAndIsRevertedFalse(1L, 100L)).thenReturn(0L);
        when(voucherUsageRepository.countByVoucherIdAndUserIdAndIsRevertedFalse(2L, 100L)).thenReturn(2L); // đạt giới hạn (max 2)

        // Đơn 120.000đ (đủ min 100k của productVoucher)
        List<VoucherClientResponse> results = voucherService.getAvailableVouchersForCustomer(100L, new BigDecimal("120000.00"));

        assertEquals(2, results.size());
        assertTrue(results.get(0).isEligible());
        assertFalse(results.get(1).isEligible()); // shippingVoucher bị false do đạt giới hạn user
        assertTrue(results.get(1).getIneligibleReason().contains("giới hạn"));
    }

    @Test
    @DisplayName("checkVoucherEligibility trả về lỗi khi mã không tồn tại")
    void testCheckVoucherEligibility_NotFound() {
        when(voucherRepository.findByCodeIgnoreCase("UNKNOWN")).thenReturn(Optional.empty());

        VoucherCheckResponse response = voucherService.checkVoucherEligibility("UNKNOWN", 1L, new BigDecimal("100000"), new BigDecimal("15000"));

        assertFalse(response.isValid());
        assertTrue(response.getMessage().contains("không tồn tại"));
    }

    @Test
    @DisplayName("checkVoucherEligibility trả về lỗi khi mã chưa đến ngày bắt đầu (upcoming)")
    void testCheckVoucherEligibility_Upcoming() {
        productVoucher.setStartDate(now.plusDays(2));
        productVoucher.setEndDate(now.plusDays(5));
        when(voucherRepository.findByCodeIgnoreCase("THUNDER20")).thenReturn(Optional.of(productVoucher));

        VoucherCheckResponse response = voucherService.checkVoucherEligibility("THUNDER20", 1L, new BigDecimal("150000"), new BigDecimal("15000"));

        assertFalse(response.isValid());
        assertTrue(response.getMessage().contains("chưa đến thời gian"));
    }

    @Test
    @DisplayName("checkVoucherEligibility trả về lỗi khi mã đã hết hạn (expired)")
    void testCheckVoucherEligibility_Expired() {
        productVoucher.setStartDate(now.minusDays(5));
        productVoucher.setEndDate(now.minusDays(1));
        when(voucherRepository.findByCodeIgnoreCase("THUNDER20")).thenReturn(Optional.of(productVoucher));

        VoucherCheckResponse response = voucherService.checkVoucherEligibility("THUNDER20", 1L, new BigDecimal("150000"), new BigDecimal("15000"));

        assertFalse(response.isValid());
        assertTrue(response.getMessage().contains("đã hết hạn"));
    }

    @Test
    @DisplayName("checkVoucherEligibility trả về lỗi khi voucher đã hết lượt sử dụng hệ thống")
    void testCheckVoucherEligibility_Depleted() {
        productVoucher.setUsageLimit(5);
        productVoucher.setUsedCount(5); // 5/5
        when(voucherRepository.findByCodeIgnoreCase("THUNDER20")).thenReturn(Optional.of(productVoucher));

        VoucherCheckResponse response = voucherService.checkVoucherEligibility("THUNDER20", 1L, new BigDecimal("150000"), new BigDecimal("15000"));

        assertFalse(response.isValid());
        assertTrue(response.getMessage().contains("hết lượt"));
    }

    @Test
    @DisplayName("checkVoucherEligibility trả về lỗi khi khách đã dùng quá số lượt cho phép")
    void testCheckVoucherEligibility_UserLimitExceeded() {
        when(voucherRepository.findByCodeIgnoreCase("THUNDER20")).thenReturn(Optional.of(productVoucher));
        when(voucherUsageRepository.countByVoucherIdAndUserIdAndIsRevertedFalse(1L, 100L)).thenReturn(1L); // max 1

        VoucherCheckResponse response = voucherService.checkVoucherEligibility("THUNDER20", 100L, new BigDecimal("150000"), new BigDecimal("15000"));

        assertFalse(response.isValid());
        assertTrue(response.getMessage().contains("hết số lượt cho phép"));
    }

    @Test
    @DisplayName("checkVoucherEligibility trả về lỗi khi đơn chưa đạt giá trị tối thiểu")
    void testCheckVoucherEligibility_BelowMinOrderAmount() {
        when(voucherRepository.findByCodeIgnoreCase("THUNDER20")).thenReturn(Optional.of(productVoucher));
        when(voucherUsageRepository.countByVoucherIdAndUserIdAndIsRevertedFalse(1L, 100L)).thenReturn(0L);

        // Đơn 80.000đ < 100.000đ
        VoucherCheckResponse response = voucherService.checkVoucherEligibility("THUNDER20", 100L, new BigDecimal("80000"), new BigDecimal("15000"));

        assertFalse(response.isValid());
        assertTrue(response.getMessage().contains("chưa đạt giá trị tối thiểu"));
    }

    @Test
    @DisplayName("checkVoucherEligibility thành công tính toán giảm giá PRODUCT với PERCENT và áp trần maxDiscount")
    void testCheckVoucherEligibility_ProductPercent_Capped() {
        when(voucherRepository.findByCodeIgnoreCase("THUNDER20")).thenReturn(Optional.of(productVoucher));
        when(voucherUsageRepository.countByVoucherIdAndUserIdAndIsRevertedFalse(1L, 100L)).thenReturn(0L);

        // Đơn 200.000đ, giảm 20% = 40.000đ, nhưng trần maxDiscount = 30.000đ
        VoucherCheckResponse response = voucherService.checkVoucherEligibility(
                "THUNDER20", 100L, new BigDecimal("200000.00"), new BigDecimal("20000.00")
        );

        assertTrue(response.isValid());
        assertEquals("PRODUCT", response.getVoucherType());
        assertEquals(new BigDecimal("30000.00"), response.getDiscountAmount());
        assertEquals(new BigDecimal("170000.00"), response.getFinalSubtotal());
        assertEquals(new BigDecimal("20000.00"), response.getFinalShippingFee());
    }

    @Test
    @DisplayName("checkVoucherEligibility thành công tính toán giảm giá SHIPPING với FIXED_AMOUNT")
    void testCheckVoucherEligibility_ShippingFixedAmount() {
        when(voucherRepository.findByCodeIgnoreCase("FREESHIP")).thenReturn(Optional.of(shippingVoucher));
        when(voucherUsageRepository.countByVoucherIdAndUserIdAndIsRevertedFalse(2L, 100L)).thenReturn(0L);

        // Đơn 100k, ship 25k, giảm ship 15k -> ship còn 10k
        VoucherCheckResponse response = voucherService.checkVoucherEligibility(
                "FREESHIP", 100L, new BigDecimal("100000.00"), new BigDecimal("25000.00")
        );

        assertTrue(response.isValid());
        assertEquals("SHIPPING", response.getVoucherType());
        assertEquals(new BigDecimal("15000.00"), response.getDiscountAmount());
        assertEquals(new BigDecimal("100000.00"), response.getFinalSubtotal());
        assertEquals(new BigDecimal("10000.00"), response.getFinalShippingFee());
    }

    // =========================================================================
    // 6. USAGE RECORDING & REVERT TESTS
    // =========================================================================

    @Test
    @DisplayName("recordVoucherUsage tăng usedCount và lưu bản ghi VoucherUsage")
    void testRecordVoucherUsage() {
        User user = User.builder().id(10L).build();
        Order order = Order.builder().id(20L).build();

        int initialCount = productVoucher.getUsedCount();
        voucherService.recordVoucherUsage(productVoucher, user, order, new BigDecimal("30000.00"));

        assertEquals(initialCount + 1, productVoucher.getUsedCount());
        verify(voucherRepository).save(productVoucher);
        verify(voucherUsageRepository).save(any(VoucherUsage.class));
    }

    @Test
    @DisplayName("revertVoucherUsage đánh dấu hoàn lượt và giảm usedCount khi đơn bị hủy")
    void testRevertVoucherUsage() {
        Order order = Order.builder().id(50L).build();
        VoucherUsage usage = VoucherUsage.builder()
                .id(1L)
                .voucher(productVoucher)
                .order(order)
                .isReverted(false)
                .build();

        when(voucherUsageRepository.findByOrderId(50L)).thenReturn(List.of(usage));

        int initialCount = productVoucher.getUsedCount();
        voucherService.revertVoucherUsage(order);

        assertTrue(usage.getIsReverted());
        assertEquals(initialCount - 1, productVoucher.getUsedCount());
        verify(voucherUsageRepository).save(usage);
        verify(voucherRepository).save(productVoucher);
    }
}
