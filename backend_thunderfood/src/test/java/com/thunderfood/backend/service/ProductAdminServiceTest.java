package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.product.ProductAdminResponse;
import com.thunderfood.backend.dto.product.ProductCreateRequest;
import com.thunderfood.backend.dto.product.ProductImageRequest;
import com.thunderfood.backend.dto.product.ProductUpdateRequest;
import com.thunderfood.backend.entity.Category;
import com.thunderfood.backend.entity.Product;
import com.thunderfood.backend.entity.ProductImage;
import com.thunderfood.backend.exception.ResourceNotFoundException;
import com.thunderfood.backend.repository.CartItemRepository;
import com.thunderfood.backend.repository.CategoryRepository;
import com.thunderfood.backend.repository.ProductImageRepository;
import com.thunderfood.backend.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductAdminServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductImageRepository productImageRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @InjectMocks
    private ProductService productService;

    private Category category;
    private Product product;

    @BeforeEach
    void setUp() {
        category = Category.builder()
                .id(1)
                .name("Cơm trưa")
                .slug("com-trua")
                .isActive(true)
                .build();

        product = Product.builder()
                .id(10L)
                .name("Cơm Tấm Sườn Bì")
                .slug("com-tam-suon-bi")
                .category(category)
                .price(new BigDecimal("45000"))
                .discountPrice(new BigDecimal("40000"))
                .stockQuantity(50)
                .soldCount(10)
                .avgRating(new BigDecimal("4.5"))
                .isAvailable(true)
                .description("Cơm tấm sườn bì chả thơm ngon")
                .build();
    }

    @Test
    @DisplayName("createProduct thành công và tự động sinh slug tiếng Việt chuẩn SEO")
    void testCreateProductAutoSlug() {
        ProductCreateRequest request = ProductCreateRequest.builder()
                .name("Cơm Gà Xối Mỡ Đặc Biệt")
                .categoryId(1)
                .price(new BigDecimal("50000"))
                .discountPrice(new BigDecimal("45000"))
                .stockQuantity(100)
                .description("Gà xối mỡ giòn rụm")
                .isAvailable(true)
                .images(List.of(
                        ProductImageRequest.builder().imageUrl("https://img1.jpg").isThumbnail(true).build(),
                        ProductImageRequest.builder().imageUrl("https://img2.jpg").isThumbnail(false).build()
                ))
                .build();

        when(productRepository.existsBySlug("com-ga-xoi-mo-dac-biet")).thenReturn(false);
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setId(20L);
            return p;
        });
        when(productImageRepository.findByProductIdOrderByIsThumbnailDescSortOrderAsc(20L)).thenReturn(List.of(
                ProductImage.builder().id(1L).imageUrl("https://img1.jpg").isThumbnail(true).build(),
                ProductImage.builder().id(2L).imageUrl("https://img2.jpg").isThumbnail(false).build()
        ));

        ProductAdminResponse response = productService.createProduct(request);

        assertNotNull(response);
        assertEquals(20L, response.getId());
        assertEquals("Cơm Gà Xối Mỡ Đặc Biệt", response.getName());
        assertEquals("com-ga-xoi-mo-dac-biet", response.getSlug());
        assertEquals(new BigDecimal("50000"), response.getPrice());
        assertEquals(new BigDecimal("45000"), response.getDiscountPrice());
        assertEquals(2, response.getImages().size());
        verify(productImageRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("createProduct ném ngoại lệ khi slug đã tồn tại")
    void testCreateProductDuplicateSlug() {
        ProductCreateRequest request = ProductCreateRequest.builder()
                .name("Cơm Tấm Sườn Bì")
                .slug("com-tam-suon-bi")
                .categoryId(1)
                .price(new BigDecimal("45000"))
                .build();

        when(productRepository.existsBySlug("com-tam-suon-bi")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> productService.createProduct(request)
        );
        assertTrue(ex.getMessage().contains("đã tồn tại"));
    }

    @Test
    @DisplayName("createProduct ném ngoại lệ khi danh mục không tồn tại")
    void testCreateProductCategoryNotFound() {
        ProductCreateRequest request = ProductCreateRequest.builder()
                .name("Cơm Chiên Dương Châu")
                .categoryId(999)
                .price(new BigDecimal("40000"))
                .build();

        when(productRepository.existsBySlug("com-chien-duong-chau")).thenReturn(false);
        when(categoryRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.createProduct(request));
    }

    @Test
    @DisplayName("createProduct ném ngoại lệ khi giá khuyến mãi lớn hơn hoặc bằng giá gốc")
    void testCreateProductInvalidDiscountPrice() {
        ProductCreateRequest request = ProductCreateRequest.builder()
                .name("Trà Chanh Giã Tay")
                .categoryId(1)
                .price(new BigDecimal("30000"))
                .discountPrice(new BigDecimal("35000"))
                .build();

        when(productRepository.existsBySlug("tra-chanh-gia-tay")).thenReturn(false);
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> productService.createProduct(request)
        );
        assertTrue(ex.getMessage().contains("Giá khuyến mãi phải nhỏ hơn giá gốc"));
    }

    @Test
    @DisplayName("updateProduct cập nhật thông tin và đồng bộ danh sách ảnh mới thành công")
    void testUpdateProductSuccess() {
        ProductUpdateRequest request = ProductUpdateRequest.builder()
                .name("Cơm Tấm Sườn Cốt Lết")
                .slug("com-tam-suon-cot-let")
                .categoryId(1)
                .price(new BigDecimal("55000"))
                .discountPrice(new BigDecimal("50000"))
                .stockQuantity(80)
                .description("Cơm sườn cốt lết dày thịt")
                .isAvailable(true)
                .images(List.of(
                        ProductImageRequest.builder().imageUrl("https://new-img.jpg").isThumbnail(true).build()
                ))
                .build();

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(productRepository.existsBySlugAndIdNot("com-tam-suon-cot-let", 10L)).thenReturn(false);
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(productImageRepository.findByProductIdOrderByIsThumbnailDescSortOrderAsc(10L)).thenReturn(List.of(
                ProductImage.builder().id(3L).imageUrl("https://new-img.jpg").isThumbnail(true).build()
        ));

        ProductAdminResponse response = productService.updateProduct(10L, request);

        assertNotNull(response);
        assertEquals("Cơm Tấm Sườn Cốt Lết", response.getName());
        assertEquals("com-tam-suon-cot-let", response.getSlug());
        assertEquals(new BigDecimal("55000"), response.getPrice());
        verify(productImageRepository).deleteByProductId(10L);
        verify(productImageRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("updateProduct ném ngoại lệ khi món ăn không tồn tại")
    void testUpdateProductNotFound() {
        ProductUpdateRequest request = ProductUpdateRequest.builder()
                .name("Món không tồn tại")
                .categoryId(1)
                .price(new BigDecimal("50000"))
                .build();

        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.updateProduct(999L, request));
    }

    @Test
    @DisplayName("updateProduct ném ngoại lệ khi slug đã trùng với món khác")
    void testUpdateProductDuplicateSlugOther() {
        ProductUpdateRequest request = ProductUpdateRequest.builder()
                .name("Cơm Tấm")
                .slug("com-tam-da-co")
                .categoryId(1)
                .price(new BigDecimal("50000"))
                .build();

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(productRepository.existsBySlugAndIdNot("com-tam-da-co", 10L)).thenReturn(true);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> productService.updateProduct(10L, request)
        );
        assertTrue(ex.getMessage().contains("đã tồn tại trên một món ăn khác"));
    }

    @Test
    @DisplayName("deleteProduct thực hiện xóa mềm món ăn và dọn khỏi giỏ hàng")
    void testDeleteProductSoftDelete() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        productService.deleteProduct(10L);

        ArgumentCaptor<Product> captor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(captor.capture());
        assertFalse(captor.getValue().getIsAvailable());
        verify(cartItemRepository).deleteByProductId(10L);
    }

    @Test
    @DisplayName("getProductDetailForAdmin trả về chi tiết món ăn")
    void testGetProductDetailForAdmin() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(productImageRepository.findByProductIdOrderByIsThumbnailDescSortOrderAsc(10L)).thenReturn(List.of(
                ProductImage.builder().id(1L).imageUrl("https://img.jpg").isThumbnail(true).build()
        ));

        ProductAdminResponse response = productService.getProductDetailForAdmin(10L);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Cơm Tấm Sườn Bì", response.getName());
        assertEquals(1, response.getImages().size());
    }
}
