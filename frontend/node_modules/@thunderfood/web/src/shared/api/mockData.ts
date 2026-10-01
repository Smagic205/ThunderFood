import type { Banner, Category, Voucher, Product } from '../types';

export const mockBanners: Banner[] = [
  { id: 1, imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop', linkUrl: '/menu?cat=1', sortOrder: 1, isActive: true },
  { id: 2, imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=2065&auto=format&fit=crop', linkUrl: '/menu?cat=2', sortOrder: 2, isActive: true },
];

export const mockVouchers: Voucher[] = [
  { id: 1, code: 'FREESHIP50K', description: 'Giảm tối đa 50k phí vận chuyển', discountValue: 50000, discountType: 'FIXED_AMOUNT', minOrderValue: 150000, startDate: '2026-09-01T00:00:00Z', endDate: '2026-10-31T00:00:00Z', isActive: true },
  { id: 2, code: 'GIAM20', description: 'Giảm 20% đơn từ 200k', discountValue: 20, discountType: 'PERCENTAGE', minOrderValue: 200000, maxDiscount: 100000, startDate: '2026-09-01T00:00:00Z', endDate: '2026-10-15T00:00:00Z', isActive: true },
  { id: 3, code: 'THUNDER100', description: 'Giảm 100k cho khách hàng mới', discountValue: 100000, discountType: 'FIXED_AMOUNT', minOrderValue: 300000, startDate: '2026-09-01T00:00:00Z', endDate: '2026-12-31T00:00:00Z', isActive: true },
];

export const mockCategories: Category[] = [
  { id: 1, name: 'Bánh Mì', slug: 'banh-mi', description: 'Giòn rụm thơm lừng', isActive: true, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3014/3014493.png' },
  { id: 2, name: 'Phở', slug: 'pho', description: 'Đậm đà hương vị truyền thống', isActive: true },
  { id: 3, name: 'Burger', slug: 'burger', description: 'Đầy đặn, đẫm sốt', isActive: true, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png' },
  { id: 4, name: 'Trà Sữa', slug: 'do-uong', description: 'Ngọt ngào, mát lạnh', isActive: true },
  { id: 5, name: 'Cơm Tấm', slug: 'com', description: 'Sườn bì chả ngon lành', isActive: true, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448043.png' },
  { id: 6, name: 'Ăn Vặt', slug: 'an-vat', description: 'Nhâm nhi mỗi ngày', isActive: true },
];

export const mockProducts: Product[] = [
  { id: 1, name: 'Combo Sấm Sét', description: '2 Gà rán, 1 Burger Zinger, 1 Khoai tây chiên, 1 Pepsi', categoryName: 'Combo', categoryId: 1, price: 220000, discountPrice: 189000, avgRating: 4.8, soldCount: 1540, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png', isBestSeller: true, stockQuantity: 10, isAvailable: true },
  { id: 2, name: 'Gà Rán Giòn Cay (3 Miếng)', description: 'Gà rán tẩm gia vị cay nồng đặc biệt của Thunder', categoryName: 'Gà Rán', categoryId: 1, price: 115000, avgRating: 4.6, soldCount: 890, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3014/3014493.png', stockQuantity: 50, isAvailable: true },
  { id: 3, name: 'Pizza Bò Băm Nấm', description: 'Cỡ vừa, viền phô mai béo ngậy', categoryName: 'Pizza', categoryId: 2, price: 199000, discountPrice: 155000, avgRating: 4.9, soldCount: 420, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3014/3014526.png', isBestSeller: true, stockQuantity: 5, isAvailable: true },
  { id: 4, name: 'Trà Sữa Trân Châu Đường Đen', description: 'Size L, đậm vị trà thơm vị sữa', categoryName: 'Trà Sữa', categoryId: 4, price: 55000, avgRating: 4.7, soldCount: 2100, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3081/3081162.png', stockQuantity: 0, isAvailable: true },
];