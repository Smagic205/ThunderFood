package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannerRepository extends JpaRepository<Banner, Long> {

    List<Banner> findByIsActiveTrueOrderBySortOrderAsc();

    List<Banner> findAllByOrderBySortOrderAsc();
}

