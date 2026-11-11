package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.banner.BannerResponse;
import com.thunderfood.backend.dto.banner.CreateBannerRequest;
import com.thunderfood.backend.dto.banner.UpdateBannerRequest;

import java.util.List;

public interface BannerService {

    List<BannerResponse> getActiveBanners();

    List<BannerResponse> getAllBannersForAdmin();

    BannerResponse getBannerById(Long id);

    BannerResponse createBanner(CreateBannerRequest request);

    BannerResponse updateBanner(Long id, UpdateBannerRequest request);

    BannerResponse toggleBannerActive(Long id);

    void deleteBanner(Long id);
}

