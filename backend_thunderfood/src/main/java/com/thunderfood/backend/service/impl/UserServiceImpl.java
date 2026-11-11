package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.dto.address.AddressResponse;
import com.thunderfood.backend.dto.auth.RegisterRequest;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.staff.StaffAccountResponse;
import com.thunderfood.backend.dto.upload.ImageUploadResponse;
import com.thunderfood.backend.dto.user.CustomerProfileResponse;
import com.thunderfood.backend.dto.user.UpdateCustomerProfileRequest;
import com.thunderfood.backend.dto.user.UpdateUserRoleRequest;
import com.thunderfood.backend.dto.user.UpdateUserStatusRequest;
import com.thunderfood.backend.dto.user.UserAdminResponse;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.ConflictException;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.AddressRepository;
import com.thunderfood.backend.repository.RoleRepository;
import com.thunderfood.backend.repository.UserRepository;
import com.thunderfood.backend.repository.UserTokenRepository;
import com.thunderfood.backend.service.CloudinaryService;
import com.thunderfood.backend.service.UserService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AddressRepository addressRepository;
    private final UserTokenRepository userTokenRepository;
    private final CloudinaryService cloudinaryService;
    private final PasswordEncoder passwordEncoder;

    @Override
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

    @Override
    @Transactional
    public CustomerProfileResponse updateCustomerProfile(Long userId, UpdateCustomerProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin khách hàng với ID: " + userId));

        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone().trim());

        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        User updatedUser = userRepository.save(user);
        log.info("Cập nhật thông tin khách hàng thành công: userId={}, fullName={}, phone={}",
                updatedUser.getId(), updatedUser.getFullName(), updatedUser.getPhone());

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

    @Override
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

    @Override
    @Transactional
    public StaffAccountResponse createStaffAccount(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email đã được sử dụng");
        }

        Role staffRole = roleRepository.findByName("STAFF")
                .orElseThrow(() -> new ResourceNotFoundException("Role STAFF không tồn tại trong hệ thống"));

        User staffUser = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .role(staffRole)
                .authProvider("LOCAL")
                .status("ACTIVE")
                .build();

        User savedStaff = userRepository.save(staffUser);
        log.info("Admin đã tạo tài khoản nhân viên mới: userId={}, email={}, fullName={}",
                savedStaff.getId(), savedStaff.getEmail(), savedStaff.getFullName());

        return StaffAccountResponse.fromEntity(savedStaff);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffAccountResponse> getAllStaffs() {
        return userRepository.findByRoleNameOrderByCreatedAtDesc("STAFF")
                .stream()
                .map(StaffAccountResponse::fromEntity)
                .toList();
    }

    // ── Quản lý người dùng cho Admin ─────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserAdminResponse> getAllUsersForAdmin(String keyword, String role, String status, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.trim().isEmpty()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate namePredicate = cb.like(cb.lower(root.get("fullName")), pattern);
                Predicate emailPredicate = cb.like(cb.lower(root.get("email")), pattern);
                Predicate phonePredicate = cb.like(cb.lower(root.get("phone")), pattern);
                predicates.add(cb.or(namePredicate, emailPredicate, phonePredicate));
            }

            if (role != null && !role.trim().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("role").get("name")), role.trim().toUpperCase()));
            }

            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> page = userRepository.findAll(spec, pageable);
        List<UserAdminResponse> items = page.getContent().stream()
                .map(this::mapToUserAdminResponse)
                .toList();

        com.thunderfood.backend.dto.common.PaginationInfo pagination = com.thunderfood.backend.dto.common.PaginationInfo.builder()
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();

        return PageResponse.<UserAdminResponse>builder()
                .content(items)
                .pagination(pagination)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserAdminResponse getUserDetailForAdmin(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
        return mapToUserAdminResponse(user);
    }

    @Override
    @Transactional
    public UserAdminResponse updateUserStatus(Long id, UpdateUserStatusRequest request, Long currentAdminId) {
        if (id.equals(currentAdminId)) {
            throw new IllegalArgumentException("Admin không thể tự khóa tài khoản của chính mình");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        String newStatus = request.getStatus().trim().toUpperCase();
        user.setStatus(newStatus);

        // Nếu khóa tài khoản, thu hồi và hủy toàn bộ token đăng nhập hiện có
        if ("LOCKED".equals(newStatus)) {
            userTokenRepository.deleteAllByUserId(id);
            log.info("Đã khóa tài khoản và thu hồi toàn bộ token của userId={}", id);
        }

        User saved = userRepository.save(user);
        log.info("Admin {} cập nhật trạng thái user {} sang {}", currentAdminId, id, newStatus);
        return mapToUserAdminResponse(saved);
    }

    @Override
    @Transactional
    public UserAdminResponse updateUserRole(Long id, UpdateUserRoleRequest request, Long currentAdminId) {
        String targetRoleName = request.getRole().trim().toUpperCase();

        if (id.equals(currentAdminId) && !"ADMIN".equals(targetRoleName)) {
            long adminCount = userRepository.countByRoleName("ADMIN");
            if (adminCount <= 1) {
                throw new IllegalArgumentException("Không thể hạ quyền Admin duy nhất trong hệ thống");
            }
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        Role newRole = roleRepository.findByName(targetRoleName)
                .orElseThrow(() -> new ResourceNotFoundException("Vai trò " + targetRoleName + " không tồn tại trong hệ thống"));

        user.setRole(newRole);
        User saved = userRepository.save(user);
        log.info("Admin {} cập nhật vai trò của user {} sang {}", currentAdminId, id, targetRoleName);

        return mapToUserAdminResponse(saved);
    }

    private UserAdminResponse mapToUserAdminResponse(User user) {
        return UserAdminResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .status(user.getStatus())
                .authProvider(user.getAuthProvider())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
