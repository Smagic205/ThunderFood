import type { Banner, Voucher, Product, Review } from '../types';

export const mockBanners: Banner[] = [
  { id: 1, imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop', linkUrl: '/menu?cat=1', sortOrder: 1, isActive: true },
  { id: 2, imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=2065&auto=format&fit=crop', linkUrl: '/menu?cat=2', sortOrder: 2, isActive: true },
];

export const mockVouchers: Voucher[] = [
  { id: 1, code: 'FREESHIP50K', description: 'Giảm tối đa 50k phí vận chuyển', discountValue: 50000, discountType: 'FIXED_AMOUNT', minOrderValue: 150000, startDate: '2026-09-01T00:00:00Z', endDate: '2026-10-31T00:00:00Z', isActive: true },
  { id: 2, code: 'GIAM20', description: 'Giảm 20% đơn từ 200k', discountValue: 20, discountType: 'PERCENTAGE', minOrderValue: 200000, maxDiscount: 100000, startDate: '2026-09-01T00:00:00Z', endDate: '2026-10-15T00:00:00Z', isActive: true },
  { id: 3, code: 'THUNDER100', description: 'Giảm 100k cho khách hàng mới', discountValue: 100000, discountType: 'FIXED_AMOUNT', minOrderValue: 300000, startDate: '2026-09-01T00:00:00Z', endDate: '2026-12-31T00:00:00Z', isActive: true },
];

export const mockProducts: Product[] = [
  { id: 1, name: 'Combo Sấm Sét', slug: 'combo-sam-set', description: '2 Gà rán, 1 Burger Zinger, 1 Khoai tây chiên, 1 Pepsi', categoryId: 1, price: 220000, discountPrice: 189000, avgRating: 4.8, soldCount: 1540, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png', images: ['https://cdn-icons-png.flaticon.com/512/3075/3075977.png', 'https://cdn-icons-png.flaticon.com/512/3075/3075978.png', 'https://cdn-icons-png.flaticon.com/512/3075/3075979.png'], isBestSeller: true, stockQuantity: 10, isAvailable: true, reviewCount: 342 },
  { id: 2, name: 'Gà Rán Giòn Cay (3 Miếng)', slug: 'ga-ran-gion-cay-3-mieng', description: 'Gà rán tẩm gia vị cay nồng đặc biệt của Thunder', categoryId: 1, price: 115000, avgRating: 4.6, soldCount: 890, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3014/3014493.png', images: ['https://cdn-icons-png.flaticon.com/512/3014/3014493.png', 'https://cdn-icons-png.flaticon.com/512/3014/3014494.png'], stockQuantity: 50, isAvailable: true, reviewCount: 128 },
  { id: 3, name: 'Pizza Bò Băm Nấm', slug: 'pizza-bo-bam-nam', description: 'Cỡ vừa, viền phô mai béo ngậy', categoryId: 2, price: 199000, discountPrice: 155000, avgRating: 4.9, soldCount: 420, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3014/3014526.png', images: ['https://cdn-icons-png.flaticon.com/512/3014/3014526.png'], isBestSeller: true, stockQuantity: 5, isAvailable: true, reviewCount: 89 },
  { id: 4, name: 'Trà Sữa Trân Châu Đường Đen', slug: 'tra-sua-tran-chau-duong-den', description: 'Size L, đậm vị trà thơm vị sữa', categoryId: 4, price: 55000, avgRating: 4.7, soldCount: 2100, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3081/3081162.png', images: ['https://cdn-icons-png.flaticon.com/512/3081/3081162.png', 'https://cdn-icons-png.flaticon.com/512/3081/3081163.png', 'https://cdn-icons-png.flaticon.com/512/3081/3081164.png'], stockQuantity: 0, isAvailable: true, reviewCount: 560 },
];

export const mockReviews: Review[] = [
  { id: 1, productId: 1, userName: 'Nguyễn Văn A', rating: 5, comment: 'Combo tuyệt vời, gà giòn và nóng hổi. Mình rất ưng ý!', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png', createdAt: '2026-09-30T10:00:00Z', adminReply: 'Cảm ơn bạn đã ủng hộ ThunderFood!' },
  { id: 2, productId: 1, userName: 'Trần Thị B', rating: 4, comment: 'Ngon nhưng khoai tây chiên hơi mềm.', createdAt: '2026-09-28T14:30:00Z' },
  { id: 3, productId: 1, userName: 'Lê C', rating: 5, comment: 'Ship siêu nhanh, đóng gói cẩn thận giữ nhiệt tốt.', createdAt: '2026-09-25T18:15:00Z' },
];
