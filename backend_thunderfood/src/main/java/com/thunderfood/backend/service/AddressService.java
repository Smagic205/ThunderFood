package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.address.AddressResponse;
import com.thunderfood.backend.dto.address.CreateAddressRequest;
import com.thunderfood.backend.dto.address.ServiceWardResponse;
import com.thunderfood.backend.entity.Address;
import com.thunderfood.backend.entity.ServiceWard;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.AddressRepository;
import com.thunderfood.backend.repository.ServiceWardRepository;
import com.thunderfood.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AddressService {

    private final ServiceWardRepository serviceWardRepository;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    /**
     * Lấy danh sách phường/xã phục vụ giao hàng (is_active = true)
     * để hiển thị sang frontend cho user lựa chọn qua dropdown/combobox/search
     *
     * @param keyword Từ khóa tìm kiếm theo tên phường/xã (tùy chọn)
     * @param type    Kiểu đơn vị hành chính: PHUONG hoặc XA (tùy chọn)
     * @return Danh sách ServiceWardResponse
     */
    @Transactional(readOnly = true)
    public List<ServiceWardResponse> getActiveWards(String keyword, String type) {
        List<ServiceWard> wards;

        if (keyword != null && !keyword.trim().isBlank()) {
            wards = serviceWardRepository.searchActiveWards(keyword.trim());
        } else if (type != null && !type.trim().isBlank()) {
            String normalizedType = normalizeWardType(type);
            wards = serviceWardRepository.findByIsActiveTrueAndTypeIgnoreCaseOrderByWardNameAsc(normalizedType);
        } else {
            wards = serviceWardRepository.findByIsActiveTrueOrderByWardNameAsc();
        }

        return wards.stream()
                .map(ServiceWardResponse::fromEntity)
                .toList();
    }

    /**
     * Lưu địa chỉ nhận hàng của khách hàng sau khi đã chọn phường/xã và nhập địa chỉ nhà
     *
     * @param userId  ID người dùng đăng nhập
     * @param request Dữ liệu địa chỉ nhận hàng
     * @return AddressResponse thông tin địa chỉ đã lưu
     */
    @Transactional
    public AddressResponse createAddress(Long userId, CreateAddressRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng"));

        // 1. Xác định Phường/Xã từ wardId hoặc wardName + kiểu (PHUONG/XA)
        ServiceWard ward = resolveServiceWard(request);

        if (ward.getIsActive() != null && !ward.getIsActive()) {
            throw new IllegalArgumentException("Khu vực " + ward.getWardName() + " hiện đang tạm ngưng phục vụ giao hàng");
        }

        // 2. Xác định tên người nhận (ưu tiên request, nếu trống thì lấy tên tài khoản)
        String receiverName = (request.getReceiverName() != null && !request.getReceiverName().trim().isBlank())
                ? request.getReceiverName().trim()
                : user.getFullName();

        // 3. Xác định số điện thoại (ưu tiên request, nếu trống thì lấy SĐT tài khoản)
        String phone = (request.getPhone() != null && !request.getPhone().trim().isBlank())
                ? request.getPhone().trim()
                : user.getPhone();

        if (phone == null || phone.isBlank()) {
            throw new IllegalArgumentException("Vui lòng cung cấp số điện thoại người nhận hàng");
        }

        // 4. Xử lý địa chỉ mặc định
        boolean isFirstAddress = !addressRepository.existsByUserId(userId);
        boolean isDefault = isFirstAddress || Boolean.TRUE.equals(request.getIsDefault());

        if (isDefault) {
            addressRepository.resetDefaultAddressForUser(userId);
        }

        // 5. Lưu entity Address
        Address address = Address.builder()
                .user(user)
                .receiverName(receiverName)
                .phone(phone)
                .ward(ward)
                .detailAddress(request.getDetailAddress().trim())
                .isDefault(isDefault)
                .build();

        Address savedAddress = addressRepository.save(address);
        log.info("Lưu địa chỉ nhận hàng thành công: addressId={}, userId={}, ward={}, detailAddress={}",
                savedAddress.getId(), userId, ward.getWardName(), savedAddress.getDetailAddress());

        return AddressResponse.fromEntity(savedAddress);
    }

    /**
     * Lấy danh sách địa chỉ nhận hàng của khách hàng
     */
    @Transactional(readOnly = true)
    public List<AddressResponse> getUserAddresses(Long userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId).stream()
                .map(AddressResponse::fromEntity)
                .toList();
    }

    /**
     * Lấy địa chỉ giao hàng mặc định của khách hàng (nếu chưa có địa chỉ mặc định thì lấy địa chỉ đầu tiên)
     */
    @Transactional(readOnly = true)
    public AddressResponse getDefaultAddress(Long userId) {
        return addressRepository.findByUserIdAndIsDefaultTrue(userId)
                .or(() -> addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId).stream().findFirst())
                .map(AddressResponse::fromEntity)
                .orElse(null);
    }

    /**
     * Lấy chi tiết 1 địa chỉ theo ID của khách hàng
     */
    @Transactional(readOnly = true)
    public AddressResponse getAddressById(Long addressId, Long userId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ với ID: " + addressId));
        return AddressResponse.fromEntity(address);
    }

    /**
     * Cập nhật địa chỉ nhận hàng
     */
    @Transactional
    public AddressResponse updateAddress(Long addressId, Long userId, CreateAddressRequest request) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ với ID: " + addressId));

        if (request.getDetailAddress() != null && !request.getDetailAddress().trim().isBlank()) {
            address.setDetailAddress(request.getDetailAddress().trim());
        }

        if (request.getReceiverName() != null && !request.getReceiverName().trim().isBlank()) {
            address.setReceiverName(request.getReceiverName().trim());
        }

        if (request.getPhone() != null && !request.getPhone().trim().isBlank()) {
            address.setPhone(request.getPhone().trim());
        }

        // Nếu client có truyền thông tin phường/xã mới
        if (request.getWardId() != null || (request.getWardName() != null && !request.getWardName().trim().isBlank())) {
            ServiceWard newWard = resolveServiceWard(request);
            if (newWard.getIsActive() != null && !newWard.getIsActive()) {
                throw new IllegalArgumentException("Khu vực " + newWard.getWardName() + " hiện đang tạm ngưng phục vụ giao hàng");
            }
            address.setWard(newWard);
        }

        if (Boolean.TRUE.equals(request.getIsDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
            addressRepository.resetDefaultAddressForUser(userId);
            address.setIsDefault(true);
        }

        Address updatedAddress = addressRepository.save(address);
        log.info("Cập nhật địa chỉ thành công: addressId={}, userId={}", updatedAddress.getId(), userId);
        return AddressResponse.fromEntity(updatedAddress);
    }

    /**
     * Đặt địa chỉ làm mặc định
     */
    @Transactional
    public AddressResponse setDefaultAddress(Long addressId, Long userId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ với ID: " + addressId));

        addressRepository.resetDefaultAddressForUser(userId);
        address.setIsDefault(true);
        Address saved = addressRepository.save(address);

        return AddressResponse.fromEntity(saved);
    }

    /**
     * Xóa địa chỉ nhận hàng
     */
    @Transactional
    public void deleteAddress(Long addressId, Long userId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ với ID: " + addressId));

        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());
        addressRepository.delete(address);
        log.info("Xóa địa chỉ thành công: addressId={}, userId={}", addressId, userId);

        // Nếu vừa xóa địa chỉ mặc định, tự động gán địa chỉ đầu tiên còn lại làm mặc định
        if (wasDefault) {
            List<Address> remaining = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
            if (!remaining.isEmpty()) {
                Address newDefault = remaining.get(0);
                newDefault.setIsDefault(true);
                addressRepository.save(newDefault);
            }
        }
    }

    /**
     * Hàm tiện ích giải quyết ServiceWard từ wardId hoặc tên và kiểu (xã/phường)
     */
    private ServiceWard resolveServiceWard(CreateAddressRequest request) {
        // 1. Nếu có wardId -> ưu tiên tìm theo ID
        if (request.getWardId() != null) {
            return serviceWardRepository.findById(request.getWardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phường/xã với ID: " + request.getWardId()));
        }

        // 2. Nếu có tên và kiểu (xã/phường)
        if (request.getWardName() != null && !request.getWardName().trim().isBlank()) {
            String rawName = request.getWardName().trim();
            // Lọc bỏ tiền tố thừa nếu user/frontend gửi dạng "Phường Yên Lãng" hoặc "Xã Trung Tự"
            String cleanName = rawName.replaceFirst("^(?i)(Phường|Xã)\\s+", "").trim();

            String wardType = request.getWardType();
            if (wardType != null && !wardType.trim().isBlank()) {
                String normalizedType = normalizeWardType(wardType);
                Optional<ServiceWard> wardOpt = serviceWardRepository.findByWardNameIgnoreCaseAndTypeIgnoreCase(cleanName, normalizedType);
                if (wardOpt.isPresent()) {
                    return wardOpt.get();
                }
            }

            // Nếu không tìm thấy theo kiểu hoặc không truyền kiểu, tìm theo tên
            return serviceWardRepository.findFirstByWardNameIgnoreCase(cleanName)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phường/xã '" + rawName + "' trong danh sách được phục vụ giao hàng"));
        }

        throw new IllegalArgumentException("Vui lòng chọn phường/xã từ danh sách (truyền wardId hoặc tên phường/xã và kiểu xã/phường)");
    }

    private String normalizeWardType(String type) {
        if (type == null) return "PHUONG";
        String lower = type.trim().toLowerCase();
        if (lower.contains("xa") || lower.contains("xã")) {
            return "XA";
        }
        return "PHUONG";
    }
}
