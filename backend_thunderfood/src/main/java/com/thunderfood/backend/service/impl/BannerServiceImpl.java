package com.thunderfood.backend.service.impl;

import com.thunderfood.backend.dto.banner.BannerResponse;
import com.thunderfood.backend.dto.banner.CreateBannerRequest;
import com.thunderfood.backend.dto.banner.UpdateBannerRequest;
import com.thunderfood.backend.entity.Banner;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.BannerRepository;
import com.thunderfood.backend.service.BannerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BannerServiceImpl implements BannerService {

    private final BannerRepository bannerRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BannerResponse> getActiveBanners() {
        return bannerRepository.findByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(BannerResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BannerResponse> getAllBannersForAdmin() {
        return bannerRepository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(BannerResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BannerResponse getBannerById(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner với ID: " + id));
        return BannerResponse.fromEntity(banner);
    }

    @Override
    @Transactional
    public BannerResponse createBanner(CreateBannerRequest request) {
        Banner banner = Banner.builder()
                .imageUrl(request.getImageUrl().trim())
                .linkUrl(request.getLinkUrl() != null ? request.getLinkUrl().trim() : null)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        Banner saved = bannerRepository.save(banner);
        log.info("Admin tạo mới banner thành công: id={}, imageUrl={}", saved.getId(), saved.getImageUrl());
        return BannerResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public BannerResponse updateBanner(Long id, UpdateBannerRequest request) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner với ID: " + id));

        banner.setImageUrl(request.getImageUrl().trim());
        banner.setLinkUrl(request.getLinkUrl() != null ? request.getLinkUrl().trim() : null);
        if (request.getSortOrder() != null) {
            banner.setSortOrder(request.getSortOrder());
        }
        if (request.getIsActive() != null) {
            banner.setIsActive(request.getIsActive());
        }

        Banner updated = bannerRepository.save(banner);
        log.info("Admin cập nhật banner thành công: id={}", updated.getId());
        return BannerResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public BannerResponse toggleBannerActive(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner với ID: " + id));

        banner.setIsActive(!Boolean.TRUE.equals(banner.getIsActive()));
        Banner updated = bannerRepository.save(banner);
        log.info("Admin đổi trạng thái active banner: id={}, isActive={}", updated.getId(), updated.getIsActive());
        return BannerResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public void deleteBanner(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner với ID: " + id));
        bannerRepository.delete(banner);
        log.info("Admin đã xóa banner: id={}", id);
    }
}

