package com.thunderfood.backend.service;

import com.thunderfood.backend.config.security.SecurityUtils;
import com.thunderfood.backend.dto.common.PageResponse;
import com.thunderfood.backend.dto.common.PaginationInfo;
import com.thunderfood.backend.dto.product.*;
import com.thunderfood.backend.entity.Category;
import com.thunderfood.backend.entity.Product;
import com.thunderfood.backend.entity.ProductImage;
import com.thunderfood.backend.entity.SystemSetting;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.*;
import com.thunderfood.backend.util.SoldCountFormatter;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final WishlistRepository wishlistRepository;
    private final CartItemRepository cartItemRepository;
    private final ReviewRepository reviewRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public PageResponse<ProductListItemResponse> getProducts(ProductFilterRequest filter) {
        if (filter == null) {
            filter = new ProductFilterRequest();
        }
        int page = filter.getPage();
        int size = filter.getSize();

        if (page < 1) {
            throw new IllegalArgumentException("Số trang (page) phải lớn hơn hoặc bằng 1");
        }
        if (size < 1 || size > 50) {
            throw new IllegalArgumentException("Kích thước trang (size) phải từ 1 đến 50");
        }

        Sort sortObj = resolveSort(filter.getSort());
        Specification<Product> spec = buildSpecification(filter);

        Pageable pageable = PageRequest.of(page - 1, size, sortObj);
        Page<Product> productPage = productRepository.findAll(spec, pageable);

        long totalElements = productPage.getTotalElements();
        int totalPages = productPage.getTotalPages();
        boolean hasNext = page < totalPages;
        boolean hasPrevious = page > 1 && totalPages > 0;

        PaginationInfo pagination = PaginationInfo.builder()
                .page(page)
                .size(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .hasNext(hasNext)
                .hasPrevious(hasPrevious)
                .build();

        List<Product> products = productPage.getContent();
        if (products.isEmpty()) {
            return PageResponse.<ProductListItemResponse>builder()
                    .content(Collections.emptyList())
                    .pagination(pagination)
                    .build();
        }

        List<Long> productIds = products.stream().map(Product::getId).toList();

        // 1. Lấy thumbnail của các sản phẩm trên trang (1 query, tránh N+1)
        Map<Long, String> thumbnailMap = new HashMap<>();
        List<ProductImage> images = productImageRepository.findByProductIdInOrderByPriority(productIds);
        for (ProductImage pi : images) {
            if (pi.getProduct() != null) {
                thumbnailMap.putIfAbsent(pi.getProduct().getId(), pi.getImageUrl());
            }
        }

        // 2. Lấy isFavorite và cartQuantity của user nếu đã đăng nhập (1 query IN mỗi loại, tránh N+1)
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        Set<Long> favoriteProductIds = (currentUserId != null)
                ? wishlistRepository.findProductIdsByUserIdAndProductIdIn(currentUserId, productIds)
                : Collections.emptySet();

        Map<Long, Integer> cartQuantityMap = new HashMap<>();
        if (currentUserId != null) {
            List<Object[]> cartRows = cartItemRepository.findCartQuantitiesByUserIdAndProductIdIn(currentUserId, productIds);
            for (Object[] row : cartRows) {
                Long pId = (Long) row[0];
                Integer qty = (Integer) row[1];
                cartQuantityMap.put(pId, qty != null ? qty : 0);
            }
        }

        List<ProductListItemResponse> content = products.stream().map(p -> {
            BigDecimal effectivePrice = (p.getDiscountPrice() != null && p.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0)
                    ? p.getDiscountPrice()
                    : p.getPrice();
            BigDecimal originalPrice = (p.getDiscountPrice() != null
                    && p.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0
                    && p.getDiscountPrice().compareTo(p.getPrice()) < 0)
                    ? p.getPrice()
                    : null;

            boolean inStock = Boolean.TRUE.equals(p.getIsAvailable())
                    && p.getStockQuantity() != null
                    && p.getStockQuantity() > 0;
            boolean canPurchase = currentUserId != null && inStock;

            return ProductListItemResponse.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .slug(p.getSlug())
                    .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                    .thumbnailUrl(thumbnailMap.get(p.getId()))
                    .price(effectivePrice)
                    .originalPrice(originalPrice)
                    .ratingAverage(p.getAvgRating() != null ? p.getAvgRating().doubleValue() : 0.0)
                    .soldCount(p.getSoldCount() != null ? p.getSoldCount() : 0)
                    .soldCountDisplay(SoldCountFormatter.format(p.getSoldCount()))
                    .isFavorite(favoriteProductIds.contains(p.getId()))
                    .cartQuantity(cartQuantityMap.getOrDefault(p.getId(), 0))
                    .canPurchase(canPurchase)
                    .build();
        }).toList();

        return PageResponse.<ProductListItemResponse>builder()
                .content(content)
                .pagination(pagination)
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductListItemResponse> getProducts(
            int page,
            int size,
            Integer categoryId,
            String categorySlug,
            String keyword,
            String sort
    ) {
        ProductFilterRequest filter = ProductFilterRequest.builder()
                .page(page)
                .size(size)
                .categoryId(categoryId)
                .categorySlug(categorySlug)
                .keyword(keyword)
                .sort(sort)
                .build();
        return getProducts(filter);
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getProductById(Long id) {
        Product product = productRepository.findByIdAndIsAvailableTrue(id)
                .filter(p -> p.getCategory() == null || Boolean.TRUE.equals(p.getCategory().getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
        return mapToDetailResponse(product);
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlugAndIsAvailableTrue(slug)
                .filter(p -> p.getCategory() == null || Boolean.TRUE.equals(p.getCategory().getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
        return mapToDetailResponse(product);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductListItemResponse> getProductsByCategorySlug(
            String categorySlug,
            ProductFilterRequest filter
    ) {
        if (categorySlug == null || categorySlug.trim().isEmpty()) {
            throw new IllegalArgumentException("Slug danh mục không được để trống");
        }

        Category category = categoryRepository.findBySlugAndIsActiveTrue(categorySlug.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));

        if (filter == null) {
            filter = new ProductFilterRequest();
        }
        filter.setCategoryId(category.getId());
        filter.setCategorySlug(null);
        filter.setCategory(null);

        return getProducts(filter);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductListItemResponse> getProductsByCategorySlug(
            String categorySlug,
            int page,
            int size,
            String keyword,
            String sort
    ) {
        ProductFilterRequest filter = ProductFilterRequest.builder()
                .page(page)
                .size(size)
                .keyword(keyword)
                .sort(sort)
                .build();
        return getProductsByCategorySlug(categorySlug, filter);
    }

    private Sort resolveSort(String sort) {
        if ("rating".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.DESC, "avgRating").and(Sort.by(Sort.Direction.DESC, "soldCount"));
        } else if ("priceAsc".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.ASC, "price").and(Sort.by(Sort.Direction.ASC, "id"));
        } else if ("priceDesc".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.DESC, "price").and(Sort.by(Sort.Direction.DESC, "id"));
        } else if ("newest".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"));
        } else if ("soldCountAsc".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.ASC, "soldCount").and(Sort.by(Sort.Direction.ASC, "id"));
        } else if ("discountDesc".equalsIgnoreCase(sort) || "discount".equalsIgnoreCase(sort)) {
            // Sắp xếp ưu đãi được xử lý trực tiếp trong Specification qua CriteriaBuilder.diff
            return Sort.unsorted();
        }
        // Mặc định: bestSelling / soldCountDesc
        return Sort.by(Sort.Direction.DESC, "soldCount").and(Sort.by(Sort.Direction.DESC, "id"));
    }

    private Specification<Product> buildSpecification(ProductFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Chỉ hiển thị sản phẩm đang kinh doanh và thuộc danh mục đang hoạt động
            predicates.add(cb.isTrue(root.get("isAvailable")));
            predicates.add(cb.isTrue(root.get("category").get("isActive")));

            // 2. Lọc theo danh mục (categoryId hoặc categorySlug)
            if (filter.getCategoryId() != null) {
                predicates.add(cb.equal(root.get("category").get("id"), filter.getCategoryId()));
            } else if (filter.getEffectiveCategorySlug() != null) {
                predicates.add(cb.equal(root.get("category").get("slug"), filter.getEffectiveCategorySlug()));
            }

            // 3. Tìm kiếm theo keyword
            if (filter.getKeyword() != null && !filter.getKeyword().trim().isEmpty()) {
                String pattern = "%" + filter.getKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("name")), pattern));
            }

            // Biểu thức tính giá bán thực tế (effective price): ưu tiên discountPrice nếu có và > 0
            Expression<BigDecimal> effectivePrice = cb.<BigDecimal>selectCase()
                    .when(
                            cb.and(
                                    cb.isNotNull(root.get("discountPrice")),
                                    cb.greaterThan(root.get("discountPrice"), BigDecimal.ZERO)
                            ),
                            root.get("discountPrice")
                    )
                    .otherwise(root.get("price"));

            // 4. Lọc theo khoảng giá (priceRange)
            if (filter.getPriceRange() != null && !filter.getPriceRange().trim().isEmpty()) {
                String pr = filter.getPriceRange().trim().toLowerCase();
                switch (pr) {
                    case "lt50", "under50k", "under_50k", "duoi50k", "duoi_50k" ->
                        predicates.add(cb.lessThan(effectivePrice, BigDecimal.valueOf(50000)));
                    case "m100", "50k-100k", "50k_100k", "50-100", "50_100" -> {
                        predicates.add(cb.greaterThanOrEqualTo(effectivePrice, BigDecimal.valueOf(50000)));
                        predicates.add(cb.lessThanOrEqualTo(effectivePrice, BigDecimal.valueOf(100000)));
                    }
                    case "m200", "100k-200k", "100k_200k", "100-200", "100_200" -> {
                        predicates.add(cb.greaterThan(effectivePrice, BigDecimal.valueOf(100000)));
                        predicates.add(cb.lessThanOrEqualTo(effectivePrice, BigDecimal.valueOf(200000)));
                    }
                    case "gt200", "over200k", "over_200k", "tren200k", "tren_200k" ->
                        predicates.add(cb.greaterThan(effectivePrice, BigDecimal.valueOf(200000)));
                }
            }

            // Lọc theo minPrice / maxPrice tùy chỉnh
            if (filter.getMinPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(effectivePrice, filter.getMinPrice()));
            }
            if (filter.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(effectivePrice, filter.getMaxPrice()));
            }

            // 5. Lọc theo số sao (ratingRange)
            if (filter.getRatingRange() != null && !filter.getRatingRange().trim().isEmpty()) {
                String rr = filter.getRatingRange().trim().toLowerCase();
                switch (rr) {
                    case "above4", "gt4", "gte4", "over4", "tren4", "tren_4" ->
                        predicates.add(cb.greaterThanOrEqualTo(root.get("avgRating"), BigDecimal.valueOf(4.0)));
                    case "3to4", "3-4", "3_4" -> {
                        predicates.add(cb.greaterThanOrEqualTo(root.get("avgRating"), BigDecimal.valueOf(3.0)));
                        predicates.add(cb.lessThanOrEqualTo(root.get("avgRating"), BigDecimal.valueOf(4.0)));
                    }
                    case "under3", "lt3", "lte3", "duoi3", "duoi_3" ->
                        predicates.add(cb.lessThan(root.get("avgRating"), BigDecimal.valueOf(3.0)));
                }
            }

            // Lọc theo minRating / maxRating tùy chỉnh
            if (filter.getMinRating() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("avgRating"), BigDecimal.valueOf(filter.getMinRating())));
            }
            if (filter.getMaxRating() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("avgRating"), BigDecimal.valueOf(filter.getMaxRating())));
            }

            // 6. Lọc theo ưu đãi (hasDiscount): chỉ lấy món có discountPrice hợp lệ và nhỏ hơn price
            if (Boolean.TRUE.equals(filter.getHasDiscount())) {
                predicates.add(cb.isNotNull(root.get("discountPrice")));
                predicates.add(cb.greaterThan(root.get("discountPrice"), BigDecimal.ZERO));
                predicates.add(cb.lessThan(root.get("discountPrice"), root.get("price")));
            }

            // 7. Lọc theo số lượng bán ra
            if (filter.getMinSoldCount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("soldCount"), filter.getMinSoldCount()));
            }
            if (Boolean.TRUE.equals(filter.getBestSeller())) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("soldCount"), 100));
            }

            // 8. Sắp xếp ưu đãi từ cao xuống thấp (discountDesc)
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                if ("discountDesc".equalsIgnoreCase(filter.getSort()) || "discount".equalsIgnoreCase(filter.getSort())) {
                    Expression<BigDecimal> effectiveDiscount = cb.coalesce(root.get("discountPrice"), root.get("price"));
                    Expression<BigDecimal> discountDiff = cb.diff(root.get("price"), effectiveDiscount);
                    query.orderBy(cb.desc(discountDiff), cb.desc(root.get("id")));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private ProductDetailResponse mapToDetailResponse(Product product) {
        CategoryBriefDto categoryDto = null;
        if (product.getCategory() != null) {
            categoryDto = CategoryBriefDto.builder()
                    .id(product.getCategory().getId())
                    .name(product.getCategory().getName())
                    .slug(product.getCategory().getSlug())
                    .build();
        }

        List<String> badges = new ArrayList<>();
        if (product.getCategory() != null && product.getCategory().getName() != null) {
            badges.add(product.getCategory().getName());
        }
        if (product.getSoldCount() != null && product.getSoldCount() >= 100) {
            badges.add("Bán chạy");
        }

        List<ProductImage> imageEntities = productImageRepository
                .findByProductIdOrderByIsThumbnailDescSortOrderAsc(product.getId());
        List<ProductImageDto> images = imageEntities.stream()
                .map(img -> ProductImageDto.builder()
                        .url(img.getImageUrl())
                        .isMain(Boolean.TRUE.equals(img.getIsThumbnail()))
                        .build())
                .toList();

        long reviewCount = reviewRepository.countByProductIdAndIsHiddenFalse(product.getId());

        BigDecimal effectivePrice = (product.getDiscountPrice() != null && product.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0)
                ? product.getDiscountPrice()
                : product.getPrice();
        BigDecimal originalPrice = (product.getDiscountPrice() != null
                && product.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0
                && product.getDiscountPrice().compareTo(product.getPrice()) < 0)
                ? product.getPrice()
                : null;

        boolean inStock = Boolean.TRUE.equals(product.getIsAvailable())
                && product.getStockQuantity() != null
                && product.getStockQuantity() > 0;
        StockStatusDto stockStatus = StockStatusDto.builder()
                .code(inStock ? "IN_STOCK" : "OUT_OF_STOCK")
                .label(inStock ? "Còn hàng" : "Hết hàng")
                .build();

        BigDecimal freeShipThreshold = systemSettingRepository.findBySettingKey("FREE_SHIPPING_THRESHOLD")
                .map(s -> new BigDecimal(s.getSettingValue()))
                .orElse(new BigDecimal("200000"));
        Integer estimateMinutes = systemSettingRepository.findBySettingKey("ESTIMATE_DELIVERY_MINUTES")
                .map(s -> Integer.parseInt(s.getSettingValue()))
                .orElse(30);

        DeliveryInfoDto delivery = DeliveryInfoDto.builder()
                .estimateMinutes(estimateMinutes)
                .freeShipThreshold(freeShipThreshold)
                .build();

        List<String> highlights = List.of("Nấu tươi khi có đơn", "Đóng gói giữ nhiệt");

        String kitchenAddress = systemSettingRepository.findBySettingKey("KITCHEN_ADDRESS")
                .map(SystemSetting::getSettingValue)
                .orElse("86 Hàng Bài, Hoàn Kiếm, Hà Nội");

        ProductDetailsDto details = ProductDetailsDto.builder()
                .prepTime("10 đến 15 phút")
                .consumeWithin("60 phút sau khi nhận")
                .kitchenAddress(kitchenAddress)
                .allergens("Có thể chứa gluten, sữa, trứng")
                .build();

        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        boolean isFavorite = currentUserId != null
                && wishlistRepository.existsByUserIdAndProductId(currentUserId, product.getId());
        int cartQuantity = currentUserId != null
                ? cartItemRepository.findQuantityByUserIdAndProductId(currentUserId, product.getId()).orElse(0)
                : 0;
        boolean canPurchase = currentUserId != null && inStock;

        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .category(categoryDto)
                .badges(badges)
                .images(images)
                .ratingAverage(product.getAvgRating() != null ? product.getAvgRating().doubleValue() : 0.0)
                .reviewCount(reviewCount)
                .soldCount(product.getSoldCount() != null ? product.getSoldCount() : 0)
                .soldCountDisplay(SoldCountFormatter.format(product.getSoldCount()))
                .price(effectivePrice)
                .originalPrice(originalPrice)
                .shortDescription(null)
                .description(product.getDescription())
                .stockStatus(stockStatus)
                .delivery(delivery)
                .highlights(highlights)
                .details(details)
                .isFavorite(isFavorite)
                .cartQuantity(cartQuantity)
                .canPurchase(canPurchase)
                .build();
    }
}
