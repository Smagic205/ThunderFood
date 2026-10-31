package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.cart.AddToCartRequest;
import com.thunderfood.backend.dto.cart.CartItemResponse;
import com.thunderfood.backend.dto.cart.CartResponse;
import com.thunderfood.backend.dto.cart.UpdateCartItemRequest;
import com.thunderfood.backend.entity.Cart;
import com.thunderfood.backend.entity.CartItem;
import com.thunderfood.backend.entity.Product;
import com.thunderfood.backend.entity.ProductImage;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.CartItemRepository;
import com.thunderfood.backend.repository.CartRepository;
import com.thunderfood.backend.repository.ProductImageRepository;
import com.thunderfood.backend.repository.ProductRepository;
import com.thunderfood.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final UserRepository userRepository;

    /**
     * Lấy toàn bộ thông tin giỏ hàng của user
     */
    @Transactional
    public CartResponse getCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        return buildCartResponse(cart);
    }

    /**
     * Đếm tổng số lượng món ăn trong giỏ (phục vụ badge Header nhanh chóng)
     */
    @Transactional(readOnly = true)
    public Integer getCartCount(Long userId) {
        Integer count = cartItemRepository.sumQuantityByUserId(userId);
        return count != null ? count : 0;
    }

    /**
     * Thêm món vào giỏ hàng:
     * - Nếu đã có món trong giỏ: cộng dồn số lượng
     * - Nếu chưa có: tạo mới CartItem
     * - Kiểm tra số lượng tồn kho và trạng thái kinh doanh
     */
    @Transactional
    public CartResponse addToCart(Long userId, AddToCartRequest request) {
        if (request.getQuantity() == null || request.getQuantity() < 1) {
            throw new IllegalArgumentException("Số lượng món ăn tối thiểu phải là 1");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + request.getProductId()));

        if (!Boolean.TRUE.equals(product.getIsAvailable())) {
            throw new IllegalArgumentException("Món ăn '" + product.getName() + "' hiện đang tạm ngừng kinh doanh");
        }

        Cart cart = getOrCreateCart(userId);
        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int newQuantity = existingItem.getQuantity() + request.getQuantity();

            if (product.getStockQuantity() != null && newQuantity > product.getStockQuantity()) {
                throw new IllegalArgumentException("Số lượng trong giỏ (" + newQuantity + ") vượt quá số lượng còn lại trong kho (" + product.getStockQuantity() + ")");
            }

            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
            log.info("Cộng dồn số lượng món vào giỏ: userId={}, productId={}, newQuantity={}", userId, product.getId(), newQuantity);
        } else {
            if (product.getStockQuantity() != null && request.getQuantity() > product.getStockQuantity()) {
                throw new IllegalArgumentException("Số lượng yêu cầu (" + request.getQuantity() + ") vượt quá số lượng còn lại trong kho (" + product.getStockQuantity() + ")");
            }

            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            cartItemRepository.save(newItem);
            log.info("Thêm món mới vào giỏ: userId={}, productId={}, quantity={}", userId, product.getId(), request.getQuantity());
        }

        return buildCartResponse(cart);
    }

    /**
     * Cập nhật số lượng món trong giỏ hàng:
     * - Quy tắc: Giảm về đến 1 là hết (tối thiểu = 1). Không thể giảm xuống 0.
     * - Nếu muốn xóa món phải dùng hàm xóa riêng.
     */
    @Transactional
    public CartResponse updateCartItem(Long userId, Long itemId, UpdateCartItemRequest request) {
        if (request.getQuantity() == null || request.getQuantity() < 1) {
            throw new IllegalArgumentException("Số lượng món tối thiểu phải là 1. Nếu muốn xóa món ăn khỏi giỏ hàng, vui lòng sử dụng chức năng xóa.");
        }

        CartItem item = cartItemRepository.findByIdAndCartUserId(itemId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn trong giỏ hàng hoặc bạn không có quyền thao tác"));

        Product product = item.getProduct();
        if (product.getStockQuantity() != null && request.getQuantity() > product.getStockQuantity()) {
            throw new IllegalArgumentException("Số lượng yêu cầu (" + request.getQuantity() + ") vượt quá số lượng còn lại trong kho (" + product.getStockQuantity() + ")");
        }

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);
        log.info("Cập nhật số lượng món trong giỏ: userId={}, itemId={}, quantity={}", userId, itemId, request.getQuantity());

        Cart cart = getOrCreateCart(userId);
        return buildCartResponse(cart);
    }

    /**
     * Xóa 1 món ra khỏi giỏ hàng
     */
    @Transactional
    public CartResponse removeCartItem(Long userId, Long itemId) {
        CartItem item = cartItemRepository.findByIdAndCartUserId(itemId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn trong giỏ hàng hoặc bạn không có quyền thao tác"));

        cartItemRepository.delete(item);
        log.info("Xóa món khỏi giỏ hàng: userId={}, itemId={}", userId, itemId);

        Cart cart = getOrCreateCart(userId);
        return buildCartResponse(cart);
    }

    /**
     * Xóa sạch toàn bộ giỏ hàng
     */
    @Transactional
    public CartResponse clearCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        cartItemRepository.deleteByCartId(cart.getId());
        log.info("Xóa toàn bộ món trong giỏ hàng: userId={}", userId);

        return buildCartResponse(cart);
    }

    /**
     * Lấy hoặc tự động tạo mới giỏ hàng rỗng nếu user chưa có giỏ
     */
    @Transactional
    public Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));

            Cart newCart = Cart.builder()
                    .user(user)
                    .items(new ArrayList<>())
                    .build();
            Cart saved = cartRepository.save(newCart);
            log.info("Khởi tạo giỏ hàng mới cho user: userId={}, cartId={}", userId, saved.getId());
            return saved;
        });
    }

    /**
     * Xây dựng CartResponse tính toán giá tiền, chiết khấu và gắn hình ảnh đại diện
     */
    private CartResponse buildCartResponse(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());

        List<Long> productIds = items.stream()
                .map(item -> item.getProduct().getId())
                .filter(Objects::nonNull)
                .toList();

        Map<Long, String> thumbnailMap = new HashMap<>();
        if (!productIds.isEmpty()) {
            List<ProductImage> images = productImageRepository.findByProductIdInOrderByPriority(productIds);
            for (ProductImage pi : images) {
                if (pi.getProduct() != null) {
                    thumbnailMap.putIfAbsent(pi.getProduct().getId(), pi.getImageUrl());
                }
            }
        }

        List<CartItemResponse> itemResponses = new ArrayList<>();
        int totalQuantity = 0;
        BigDecimal totalSubtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal finalAmount = BigDecimal.ZERO;

        for (CartItem item : items) {
            Product p = item.getProduct();
            if (p == null) {
                continue;
            }

            BigDecimal effectivePrice = (p.getDiscountPrice() != null
                    && p.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0
                    && p.getDiscountPrice().compareTo(p.getPrice()) < 0)
                    ? p.getDiscountPrice()
                    : p.getPrice();

            BigDecimal originalPrice = (p.getDiscountPrice() != null
                    && p.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0
                    && p.getDiscountPrice().compareTo(p.getPrice()) < 0)
                    ? p.getPrice()
                    : null;

            int qty = item.getQuantity() != null ? item.getQuantity() : 1;
            BigDecimal subtotal = effectivePrice.multiply(BigDecimal.valueOf(qty));

            BigDecimal itemSavings = (originalPrice != null)
                    ? originalPrice.subtract(effectivePrice).multiply(BigDecimal.valueOf(qty))
                    : BigDecimal.ZERO;

            BigDecimal itemOriginalTotal = (originalPrice != null ? originalPrice : effectivePrice)
                    .multiply(BigDecimal.valueOf(qty));

            totalSubtotal = totalSubtotal.add(itemOriginalTotal);
            totalDiscount = totalDiscount.add(itemSavings);
            finalAmount = finalAmount.add(subtotal);
            totalQuantity += qty;

            CartItemResponse itemResp = CartItemResponse.builder()
                    .id(item.getId())
                    .productId(p.getId())
                    .productName(p.getName())
                    .productSlug(p.getSlug())
                    .imageUrl(thumbnailMap.get(p.getId()))
                    .originalPrice(originalPrice)
                    .price(effectivePrice)
                    .quantity(qty)
                    .stockQuantity(p.getStockQuantity())
                    .isAvailable(p.getIsAvailable())
                    .subtotal(subtotal)
                    .build();

            itemResponses.add(itemResp);
        }

        return CartResponse.builder()
                .cartId(cart.getId())
                .items(itemResponses)
                .totalItems(itemResponses.size())
                .totalQuantity(totalQuantity)
                .subtotal(totalSubtotal)
                .discountTotal(totalDiscount)
                .finalAmount(finalAmount)
                .build();
    }
}
