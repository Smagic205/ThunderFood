package com.thunderfood.backend.repository;

import com.thunderfood.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByIdAndIsAvailableTrue(Long id);

    Optional<Product> findBySlugAndIsAvailableTrue(String slug);
}
