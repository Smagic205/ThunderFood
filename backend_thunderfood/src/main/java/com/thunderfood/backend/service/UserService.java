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

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    /**
     * Lấy thông tin hồ sơ của khách hàng
     *
     * @param userId ID người dùng
     * @return CustomerProfileResponse thông tin đầy đủ gồm cả email
     */
    @Transactional(readOnly = true)
    public CustomerProfileResponse getCustomerProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin khách hàng với ID: " + userId));
        return CustomerProfileResponse.fromEntity(user);
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

        // Trả về thông tin khách hàng sau khi cập nhật (bao gồm email)
        return CustomerProfileResponse.fromEntity(updatedUser);
    }
}
