package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.dto.address.ServiceWardResponse;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.entity.ServiceWard;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.ServiceWardRepository;
import com.thunderfood.backend.service.ServiceWardService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceWardServiceImpl implements ServiceWardService {

    private final ServiceWardRepository serviceWardRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ServiceWardResponse> getAllWardsForAdmin(String district, String keyword, Boolean isActive, Pageable pageable) {
        Specification<ServiceWard> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (district != null && !district.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("district")), district.trim().toLowerCase()));
            }

            if (keyword != null && !keyword.trim().isEmpty()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("wardName")), pattern));
            }

            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ServiceWard> page = serviceWardRepository.findAll(spec, pageable);
        List<ServiceWardResponse> items = page.getContent().stream()
                .map(ServiceWardResponse::fromEntity)
                .toList();

        com.thunderfood.backend.dto.common.PaginationInfo pagination = com.thunderfood.backend.dto.common.PaginationInfo.builder()
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();

        return PageResponse.<ServiceWardResponse>builder()
                .content(items)
                .pagination(pagination)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getDistricts() {
        return serviceWardRepository.findDistinctDistricts();
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceWardResponse getWardById(Integer id) {
        ServiceWard ward = serviceWardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin phường/xã với ID: " + id));
        return ServiceWardResponse.fromEntity(ward);
    }

    @Override
    @Transactional
    public ServiceWardResponse updateShippingFee(Integer id, BigDecimal fee) {
        if (fee == null || fee.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Phí giao hàng không hợp lệ");
        }

        ServiceWard ward = serviceWardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin phường/xã với ID: " + id));

        ward.setShippingFee(fee);
        ServiceWard saved = serviceWardRepository.save(ward);
        log.info("Admin cập nhật phí ship phường {} (id={}): {}", ward.getWardName(), id, fee);

        return ServiceWardResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public ServiceWardResponse toggleWardActive(Integer id) {
        ServiceWard ward = serviceWardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin phường/xã với ID: " + id));

        ward.setIsActive(!Boolean.TRUE.equals(ward.getIsActive()));
        ServiceWard saved = serviceWardRepository.save(ward);
        log.info("Admin đổi trạng thái phục vụ phường {} (id={}) sang {}", ward.getWardName(), id, saved.getIsActive());

        return ServiceWardResponse.fromEntity(saved);
    }
}
