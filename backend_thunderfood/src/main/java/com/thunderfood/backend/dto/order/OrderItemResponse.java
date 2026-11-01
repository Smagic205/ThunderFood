package com.thunderfood.backend.dto.order;

import com.thunderfood.backend.entity.OrderItem;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String productSlug;
    private String imageUrl;
    private BigDecimal productPrice;
    private Integer quantity;
    private BigDecimal lineTotal;

    public static OrderItemResponse fromEntity(OrderItem item, String imageUrl) {
        if (item == null) {
            return null;
        }
        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productName(item.getProductName())
                .productSlug(item.getProduct() != null ? item.getProduct().getSlug() : null)
                .imageUrl(imageUrl)
                .productPrice(item.getProductPrice())
                .quantity(item.getQuantity())
                .lineTotal(item.getLineTotal())
                .build();
    }
}
