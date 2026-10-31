package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.user.CustomerProfileResponse;
import com.thunderfood.backend.dto.user.UpdateCustomerProfileRequest;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thunderfood.backend.dto.address.AddressResponse;
import com.thunderfood.backend.dto.upload.ImageUploadResponse;
import com.thunderfood.backend.repository.AddressRepository;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final CloudinaryService cloudinaryService;

    /**
     * Lấy thông tin hồ sơ của khách hàng
     *
     * @param userId ID người dùng
     * @return CustomerProfileResponse thông tin đầy đủ gồm cả email và địa chỉ
     */
    @Transactional(readOnly = true)
    public CustomerProfileResponse getCustomerProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin khách hàng với ID: " + userId));

        List<AddressResponse> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream()
                .map(AddressResponse::fromEntity)
                .toList();

        AddressResponse defaultAddress = addresses.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                .findFirst()
                .orElse(addresses.isEmpty() ? null : addresses.get(0));

        return CustomerProfileResponse.fromEntity(user, defaultAddress, addresses);
    }

    /**
     * Cập nhật thông tin khách hàng (tên, số điện thoại, avatar)
     * Email gắn liền với định danh tài khoản nên KHÔNG cho phép thay đổi,
     * nhưng vẫn được trả về trong kết quả thông tin khách hàng.
     *
     * @param userId ID người dùng cần cập nhật
     * @param request Dữ liệu cập nhật
     * @return CustomerProfileResponse thông tin khách hàng sau khi cập nhật (có kèm email)
     */
    @Transactional
    public CustomerProfileResponse updateCustomerProfile(Long userId, UpdateCustomerProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin khách hàng với ID: " + userId));

        // 1. Cập nhật họ tên
        user.setFullName(request.getFullName().trim());

        // 2. Cập nhật số điện thoại
        user.setPhone(request.getPhone().trim());

        // 3. Cập nhật ảnh đại diện (nếu client có truyền)
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        // 4. LƯU Ý QUAN TRỌNG:
        // Email tuyệt đối KHÔNG được cập nhật (user.setEmail(...) không được gọi)
        // do email ứng với định danh tài khoản duy nhất trong hệ thống.

        User updatedUser = userRepository.save(user);
        log.info("Cập nhật thông tin khách hàng thành công: userId={}, fullName={}, phone={}, email={}",
                updatedUser.getId(), updatedUser.getFullName(), updatedUser.getPhone(), updatedUser.getEmail());

        List<AddressResponse> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream()
                .map(AddressResponse::fromEntity)
                .toList();

        AddressResponse defaultAddress = addresses.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                .findFirst()
                .orElse(addresses.isEmpty() ? null : addresses.get(0));

        // Trả về thông tin khách hàng sau khi cập nhật (bao gồm email và địa chỉ)
        return CustomerProfileResponse.fromEntity(updatedUser, defaultAddress, addresses);
    }

    /**
     * Tải lên ảnh đại diện lên Cloudinary và cập nhật avatarUrl của người dùng
     *
     * @param userId ID người dùng
     * @param file File ảnh tải lên
     * @return CustomerProfileResponse thông tin khách hàng sau khi cập nhật avatar
     */
    @Transactional
    public CustomerProfileResponse updateAvatar(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin khách hàng với ID: " + userId));

        ImageUploadResponse uploadResult = cloudinaryService.uploadImage(file, "thunderfood/avatars");
        user.setAvatarUrl(uploadResult.getImageUrl());

        User updatedUser = userRepository.save(user);
        log.info("Cập nhật ảnh đại diện thành công: userId={}, avatarUrl={}", userId, updatedUser.getAvatarUrl());

        List<AddressResponse> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream()
                .map(AddressResponse::fromEntity)
                .toList();

        AddressResponse defaultAddress = addresses.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                .findFirst()
                .orElse(addresses.isEmpty() ? null : addresses.get(0));

        return CustomerProfileResponse.fromEntity(updatedUser, defaultAddress, addresses);
    }
}

