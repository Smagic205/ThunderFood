import { axiosClient } from '@/shared/api/axiosClient';
import type { Category, Product, ProductPageResponse, GetProductsParams } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: 'Combo', slug: 'combo', isActive: true, art: 'combo', tint: '#FFB81C', description: 'Ăn no, tiết kiệm hơn mua lẻ' },
  { id: 2, name: 'Gà giòn', slug: 'ga-gion', isActive: true, art: 'chicken', tint: '#FF8A3D', description: 'Gà rán giòn tan, tẩm ướp 24 giờ' },
  { id: 3, name: 'Burger', slug: 'burger', isActive: true, art: 'burger', tint: '#F5B14A', description: 'Bánh nướng mỗi sáng, thịt bò tươi' },
  { id: 4, name: 'Cơm & mì', slug: 'com-mi', isActive: true, art: 'plate', tint: '#5FC58A', description: 'Bữa chính nóng hổi' },
  { id: 5, name: 'Ăn kèm', slug: 'an-kem', isActive: true, art: 'fries', tint: '#FFD24A', description: 'Khoai, salad và món ăn vặt' },
  { id: 6, name: 'Đồ uống', slug: 'do-uong', isActive: true, art: 'cup', tint: '#4FC3F7', description: 'Trà, cà phê và soda pha tươi' },
  { id: 7, name: 'Tráng miệng', slug: 'trang-mieng', isActive: true, art: 'dessert', tint: '#FF7AA8', description: 'Ngọt nhẹ để kết bữa' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    categoryId: 1,
    name: 'Combo Sấm Sét',
    slug: 'combo-sam-set',
    price: 219000,
    discountPrice: 189000,
    stockQuantity: 40,
    soldCount: 1840,
    avgRating: 4.9,
    reviewCount: 412,
    art: 'combo',
    tint: '#FFB81C',
    description: '2 miếng gà giòn, 1 burger bò, 2 phần khoai tây và 2 ly nước tùy chọn. Đủ cho hai người ăn no, tiết kiệm 30.000₫ so với mua lẻ.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
  {
    id: 2,
    categoryId: 1,
    name: 'Combo Bạn Đôi',
    slug: 'combo-ban-doi',
    price: 129000,
    discountPrice: 109000,
    stockQuantity: 55,
    soldCount: 2310,
    avgRating: 4.8,
    reviewCount: 530,
    art: 'combo',
    tint: '#FF8A3D',
    description: '1 burger bò, 1 miếng gà giòn, khoai tây vừa và 1 ly nước. Bữa trưa văn phòng vừa đủ, giao trong 30 phút.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
  {
    id: 3,
    categoryId: 1,
    name: 'Combo Cả Nhà',
    slug: 'combo-ca-nha',
    price: 389000,
    discountPrice: 339000,
    stockQuantity: 18,
    soldCount: 690,
    avgRating: 4.9,
    reviewCount: 148,
    art: 'combo',
    tint: '#6C7BFF',
    description: '6 miếng gà giòn, 2 khoai tây lớn, 4 ly nước và 1 phần bánh flan. Dành cho 4 người, kèm tặng nước sốt thêm.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
  {
    id: 4,
    categoryId: 2,
    name: 'Gà giòn Thunder (3 miếng)',
    slug: 'ga-gion-thunder-3-mieng',
    price: 89000,
    discountPrice: null,
    stockQuantity: 120,
    soldCount: 3420,
    avgRating: 4.8,
    reviewCount: 880,
    art: 'chicken',
    tint: '#FF8A3D',
    description: 'Ướp 24 giờ với hỗn hợp 11 loại gia vị, chiên vàng giòn rụm nhưng thịt bên trong vẫn mọng nước. Ăn kèm sốt chua ngọt.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
  {
    id: 5,
    categoryId: 2,
    name: 'Gà sốt mật ong tỏi',
    slug: 'ga-sot-mat-ong-toi',
    price: 99000,
    discountPrice: 85000,
    stockQuantity: 64,
    soldCount: 1560,
    avgRating: 4.7,
    reviewCount: 301,
    art: 'chicken',
    tint: '#F5B14A',
    description: 'Gà giòn áo sốt mật ong và tỏi phi thơm, vị ngọt mặn cân bằng. Rắc mè rang trước khi ra món.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
  {
    id: 6,
    categoryId: 2,
    name: 'Cánh gà sốt cay Hồ Tây',
    slug: 'canh-ga-sot-cay-ho-tay',
    price: 95000,
    discountPrice: null,
    stockQuantity: 0,
    soldCount: 1210,
    avgRating: 4.6,
    reviewCount: 204,
    art: 'chicken',
    tint: '#E5483B',
    description: '6 cánh gà chiên sốt cay ớt hiểm, cay vừa phải và hậu vị ngọt. Món được gọi nhiều nhất vào buổi tối.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
  {
    id: 7,
    categoryId: 3,
    name: 'Burger Bò Thunder',
    slug: 'burger-bo-thunder',
    price: 69000,
    discountPrice: null,
    stockQuantity: 80,
    soldCount: 2890,
    avgRating: 4.8,
    reviewCount: 690,
    art: 'burger',
    tint: '#F5B14A',
    description: 'Bò xay nướng lửa than 120g, phô mai cheddar, dưa chuột muối và sốt đặc biệt trong bánh mềm nướng bơ.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
  {
    id: 8,
    categoryId: 3,
    name: 'Burger Gà Giòn Phô Mai',
    slug: 'burger-ga-gion-pho-mai',
    price: 59000,
    discountPrice: 52000,
    stockQuantity: 72,
    soldCount: 2100,
    avgRating: 4.7,
    reviewCount: 455,
    art: 'burger',
    tint: '#FFC933',
    description: 'Đùi gà không xương chiên giòn, phô mai tan chảy, xà lách và sốt mayonnaise trứng muối.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
  {
    id: 9,
    categoryId: 4,
    name: 'Cơm gà Teriyaki',
    slug: 'com-ga-teriyaki',
    price: 65000,
    discountPrice: null,
    stockQuantity: 60,
    soldCount: 1340,
    avgRating: 4.6,
    reviewCount: 260,
    art: 'plate',
    tint: '#5FC58A',
    description: 'Gà nướng sốt teriyaki trên cơm nóng, kèm dưa leo muối và rau củ. Vị đậm đà, hợp bữa trưa.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
  {
    id: 10,
    categoryId: 4,
    name: 'Mì Ý bò bằm',
    slug: 'mi-y-bo-bam',
    price: 69000,
    discountPrice: null,
    stockQuantity: 3,
    soldCount: 980,
    avgRating: 4.5,
    reviewCount: 190,
    art: 'plate',
    tint: '#7B8CFF',
    description: 'Mì Ý sợi vừa, sốt cà chua bò bằm ninh 3 giờ, rắc phô mai Parmesan. Một phần đủ no.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
  {
    id: 11,
    categoryId: 5,
    name: 'Khoai tây lắc phô mai',
    slug: 'khoai-tay-lac-pho-mai',
    price: 39000,
    discountPrice: null,
    stockQuantity: 150,
    soldCount: 2650,
    avgRating: 4.7,
    reviewCount: 520,
    art: 'fries',
    tint: '#FFD24A',
    description: 'Khoai cắt sợi chiên giòn, lắc cùng bột phô mai. Ăn nóng mới ngon nhất.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
  {
    id: 12,
    categoryId: 6,
    name: 'Trà đào cam sả',
    slug: 'tra-dao-cam-sa',
    price: 35000,
    discountPrice: null,
    stockQuantity: 200,
    soldCount: 4100,
    avgRating: 4.8,
    reviewCount: 960,
    art: 'cup',
    tint: '#FF9A5A',
    description: 'Trà đen ủ lạnh, đào ngâm, cam vàng và sả đập dập. Thanh mát, không quá ngọt.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
  {
    id: 13,
    categoryId: 6,
    name: 'Cà phê muối Hà Nội',
    slug: 'ca-phe-muoi-ha-noi',
    price: 32000,
    discountPrice: null,
    stockQuantity: 180,
    soldCount: 3300,
    avgRating: 4.9,
    reviewCount: 740,
    art: 'cup',
    tint: '#C89A6B',
    description: 'Cà phê phin đậm, phủ lớp kem muối béo mịn. Công thức lấy cảm hứng từ quán cà phê phố cổ.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
  {
    id: 14,
    categoryId: 6,
    name: 'Trà vải hoa hồng',
    slug: 'tra-vai-hoa-hong',
    price: 38000,
    discountPrice: 33000,
    stockQuantity: 140,
    soldCount: 1890,
    avgRating: 4.6,
    reviewCount: 335,
    art: 'cup',
    tint: '#FF9FBE',
    description: 'Trà nhài, vải ngâm và cánh hoa hồng sấy. Hương thơm nhẹ, hậu vị ngọt thanh.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
  {
    id: 15,
    categoryId: 7,
    name: 'Bánh flan caramel',
    slug: 'banh-flan-caramel',
    price: 25000,
    discountPrice: null,
    stockQuantity: 90,
    soldCount: 1450,
    avgRating: 4.7,
    reviewCount: 270,
    art: 'dessert',
    tint: '#FF7AA8',
    description: 'Flan mềm mịn, caramel đắng nhẹ. Làm mới mỗi ngày, không dùng bột.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
  {
    id: 16,
    categoryId: 7,
    name: 'Sundae caramel muối',
    slug: 'sundae-caramel-muoi',
    price: 29000,
    discountPrice: null,
    stockQuantity: 44,
    soldCount: 900,
    avgRating: 4.5,
    reviewCount: 120,
    art: 'dessert',
    tint: '#C89A6B',
    description: 'Kem vani mềm rưới caramel muối và vụn bánh quy giòn.',
    isAvailable: true,
    createdAt: '2026-07-01T09:00:00+07:00',
    imgs: [],
  },
];

let memoryCategories: Category[] = [...INITIAL_CATEGORIES];
let memoryProducts: Product[] = [...INITIAL_PRODUCTS];

/**
 * Map slug → art/tint mặc định (dùng khi backend không trả art/tint).
 * Khi backend mở rộng thêm trường art/tint, có thể bỏ map này.
 */
const CATEGORY_VISUALS: Record<string, { art: string; tint: string }> = {
  combo: { art: 'combo', tint: '#FFB81C' },
  'ga-gion': { art: 'chicken', tint: '#FF8A3D' },
  burger: { art: 'burger', tint: '#F5B14A' },
  'com-mi': { art: 'plate', tint: '#5FC58A' },
  'an-kem': { art: 'fries', tint: '#FFD24A' },
  'do-uong': { art: 'cup', tint: '#4FC3F7' },
  'trang-mieng': { art: 'dessert', tint: '#FF7AA8' },
};
const DEFAULT_VISUAL = { art: 'plate', tint: '#FFB81C' };

/** Gắn art/tint/productCount vào category trả về từ backend */
function enrichCategory(raw: any): Category {
  const visual = CATEGORY_VISUALS[raw.slug] || DEFAULT_VISUAL;
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description || '',
    isActive: raw.isActive ?? true,
    art: raw.art || visual.art,
    tint: raw.tint || visual.tint,
    productCount: memoryProducts.filter((p) => p.categoryId === raw.id).length,
  };
}

/** Chuyển đổi dữ liệu sản phẩm từ backend sang model Product của frontend Admin */
function enrichProduct(raw: any): Product {
  const cat =
    memoryCategories.find(
      (c) =>
        (raw.categoryName && c.name.toLowerCase() === raw.categoryName.toLowerCase()) ||
        (raw.categoryId && c.id === raw.categoryId) ||
        (raw.category?.id && c.id === raw.category.id)
    ) || memoryCategories[0];

  const rawPrice = Number(raw.price) || 0;
  const rawOriginal = raw.originalPrice != null ? Number(raw.originalPrice) : null;
  let price = rawPrice;
  let discountPrice: number | null = null;
  if (rawOriginal && rawOriginal > rawPrice) {
    price = rawOriginal;
    discountPrice = rawPrice;
  } else if (raw.discountPrice != null) {
    discountPrice = Number(raw.discountPrice);
  }

  const thumb = raw.thumbnailUrl || (Array.isArray(raw.images) && raw.images[0]?.url) || '';
  const imgs: string[] = Array.isArray(raw.images)
    ? raw.images.map((img: any) => (typeof img === 'string' ? img : img.url))
    : raw.imgs || (thumb ? [thumb] : []);

  return {
    id: raw.id,
    categoryId: cat?.id || raw.categoryId || raw.category?.id || 1,
    categoryName: raw.categoryName || raw.category?.name || cat?.name || '',
    name: raw.name || '',
    slug: raw.slug || '',
    price,
    discountPrice,
    stockQuantity: raw.stockQuantity ?? (raw.stockStatus?.code === 'OUT_OF_STOCK' ? 0 : 50),
    soldCount: raw.soldCount ?? 0,
    soldCountDisplay: raw.soldCountDisplay ?? `${raw.soldCount ?? 0}`,
    avgRating: raw.ratingAverage ?? raw.avgRating ?? 5.0,
    reviewCount: raw.reviewCount ?? 0,
    art: cat?.art || 'plate',
    tint: cat?.tint || '#FFB81C',
    description: raw.description || '',
    isAvailable: raw.isAvailable ?? true,
    createdAt: raw.createdAt || new Date().toISOString(),
    imgs,
    thumbnailUrl: thumb,
  };
}

export const catalogApi = {
  // ─── Categories (gọi API thật, fallback mock khi offline) ───────────────────

  getCategories: async (): Promise<Category[]> => {
    try {
      const res = await axiosClient.get('/admin/categories');
      if (res.data?.success && Array.isArray(res.data.data)) {
        // Cập nhật memoryCategories từ backend
        memoryCategories = res.data.data.map(enrichCategory);
        return memoryCategories;
      }
    } catch {
      // Backend chưa chạy → fallback mock
    }
    return memoryCategories.map((c) => ({
      ...c,
      productCount: memoryProducts.filter((p) => p.categoryId === c.id).length,
    }));
  },

  saveCategory: async (categoryData: Partial<Category>): Promise<Category> => {
    const payload = {
      name: categoryData.name?.trim() || '',
      slug: categoryData.slug?.trim() || '',
      description: categoryData.description?.trim() || '',
      isActive: categoryData.isActive ?? true,
    };

    try {
      if (categoryData.id) {
        // PUT /admin/categories/{id}
        const res = await axiosClient.put(`/admin/categories/${categoryData.id}`, payload);
        if (res.data?.success) {
          const updated = enrichCategory(res.data.data);
          const idx = memoryCategories.findIndex((c) => c.id === updated.id);
          if (idx !== -1) memoryCategories[idx] = updated;
          return updated;
        }
      } else {
        // POST /admin/categories
        const res = await axiosClient.post('/admin/categories', payload);
        if (res.data?.success) {
          const created = enrichCategory(res.data.data);
          memoryCategories.push(created);
          return created;
        }
      }
    } catch (err: any) {
      // Nếu backend có phản hồi (lỗi validation / slug trùng / lỗi quyền) → ném lỗi để UI hiển thị
      if (err?.response) {
        const resData = err.response.data;
        if (resData?.data && typeof resData.data === 'object') {
          const fieldErrors = Object.values(resData.data).filter(Boolean);
          if (fieldErrors.length > 0) {
            throw new Error(fieldErrors.join('; '));
          }
        }
        if (resData?.message) {
          throw new Error(resData.message);
        }
        throw new Error(`Lỗi máy chủ (${err.response.status})`);
      }
      // Chỉ khi mất kết nối mạng / backend chưa bật mới fallback mock
    }

    // ── Fallback mock ──
    if (categoryData.id) {
      const idx = memoryCategories.findIndex((c) => c.id === categoryData.id);
      if (idx !== -1) {
        memoryCategories[idx] = { ...memoryCategories[idx], ...categoryData } as Category;
        return memoryCategories[idx];
      }
    }
    const newCat: Category = {
      id: Date.now(),
      name: payload.name,
      slug: payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      isActive: payload.isActive,
      art: 'plate',
      tint: '#FFB81C',
      description: payload.description,
    };
    memoryCategories.push(newCat);
    return newCat;
  },

  toggleCategoryActive: async (id: number, isActive: boolean): Promise<boolean> => {
    // Lấy category hiện tại để có đầy đủ thông tin cho PUT
    const current = memoryCategories.find((c) => c.id === id);
    if (!current) return false;

    try {
      const res = await axiosClient.put(`/admin/categories/${id}`, {
        name: current.name,
        slug: current.slug,
        description: current.description || '',
        isActive,
      });
      if (res.data?.success) {
        current.isActive = isActive;
        return true;
      }
    } catch (err: any) {
      if (err?.response) {
        const msg = err.response.data?.message || 'Không thể cập nhật trạng thái danh mục';
        throw new Error(msg);
      }
      // Fallback mock khi offline
    }
    current.isActive = isActive;
    return true;
  },

  deleteCategory: async (id: number): Promise<{ success: boolean; message?: string }> => {
    // Kiểm tra sản phẩm phía client trước khi gọi API
    const productsInCat = memoryProducts.filter((p) => p.categoryId === id);
    if (productsInCat.length > 0) {
      return {
        success: false,
        message: `Danh mục còn ${productsInCat.length} món, hãy chuyển món sang danh mục khác trước`,
      };
    }

    try {
      const res = await axiosClient.delete(`/admin/categories/${id}`);
      if (res.data?.success) {
        // Backend thực hiện xóa mềm (chuyển isActive sang false)
        const cat = memoryCategories.find((c) => c.id === id);
        if (cat) cat.isActive = false;
        return { success: true, message: res.data?.message || 'Đã ngưng hoạt động danh mục thành công' };
      }
      return { success: false, message: res.data?.message || 'Lỗi không xác định' };
    } catch (err: any) {
      if (err?.response) {
        const serverMsg = err.response.data?.message || 'Lỗi từ máy chủ khi xóa danh mục';
        return { success: false, message: serverMsg };
      }
      // Fallback mock khi offline
    }
    // Mock fallback: xóa khỏi danh sách
    memoryCategories = memoryCategories.filter((c) => c.id !== id);
    return { success: true, message: 'Đã xóa danh mục thành công' };
  },

  // ─── Products (kết nối API thật với phân trang, fallback mock khi offline) ───

  getProducts: async (params?: GetProductsParams): Promise<ProductPageResponse> => {
    const page = params?.page || 1;
    const size = params?.size || 10;
    const queryParams: Record<string, any> = {
      page,
      size,
    };
    if (params?.categoryId && params.categoryId > 0) {
      queryParams.categoryId = params.categoryId;
    }
    if (params?.keyword?.trim()) {
      queryParams.keyword = params.keyword.trim();
    }
    if (params?.sort) {
      queryParams.sort = params.sort;
    }

    try {
      const res = await axiosClient.get('/products', { params: queryParams });
      if (res.data?.success && res.data?.data) {
        const { content, pagination } = res.data.data;
        const mappedList = (content || []).map(enrichProduct);

        // Lưu vào memory cache để đồng bộ
        mappedList.forEach((prod: Product) => {
          const idx = memoryProducts.findIndex((p) => p.id === prod.id);
          if (idx !== -1) {
            memoryProducts[idx] = { ...memoryProducts[idx], ...prod };
          } else {
            memoryProducts.push(prod);
          }
        });

        return {
          content: mappedList,
          pagination: {
            page: pagination?.page || page,
            size: pagination?.size || size,
            totalElements: pagination?.totalElements || 0,
            totalPages: pagination?.totalPages || 1,
            hasNext: Boolean(pagination?.hasNext),
            hasPrevious: Boolean(pagination?.hasPrevious),
          },
        };
      }
    } catch (err) {
      console.warn('Lỗi gọi API /products thật, đang chuyển sang fallback dữ liệu mẫu:', err);
    }

    // ── Fallback mock khi offline ──
    let filtered = [...memoryProducts];
    if (params?.categoryId && params.categoryId > 0) {
      filtered = filtered.filter((p) => p.categoryId === params.categoryId);
    }
    if (params?.keyword?.trim()) {
      const kw = params.keyword.trim().toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(kw));
    }

    const totalElements = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const startIndex = (page - 1) * size;
    const paginatedContent = filtered.slice(startIndex, startIndex + size);

    return {
      content: paginatedContent,
      pagination: {
        page,
        size,
        totalElements,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  },

  getProductById: async (id: number): Promise<Product | null> => {
    try {
      const res = await axiosClient.get(`/products/${id}`);
      if (res.data?.success && res.data.data) {
        const p = enrichProduct(res.data.data);
        const idx = memoryProducts.findIndex((m) => m.id === id);
        if (idx !== -1) memoryProducts[idx] = p;
        return p;
      }
    } catch {
      // fallback
    }
    return memoryProducts.find((p) => p.id === id) || null;
  },

  toggleProductAvailability: async (id: number, isAvailable: boolean): Promise<boolean> => {
    const prod = memoryProducts.find((p) => p.id === id);
    if (prod) {
      prod.isAvailable = isAvailable;
      return true;
    }
    return false;
  },

  saveProduct: async (productData: Partial<Product>): Promise<Product> => {
    const cat = memoryCategories.find((c) => c.id === productData.categoryId) || memoryCategories[0];
    if (productData.id) {
      const idx = memoryProducts.findIndex((p) => p.id === productData.id);
      if (idx !== -1) {
        memoryProducts[idx] = {
          ...memoryProducts[idx],
          ...productData,
          art: cat.art,
          tint: cat.tint,
        };
        return memoryProducts[idx];
      }
    }
    const newProd: Product = {
      id: Date.now(),
      categoryId: cat.id,
      name: productData.name || '',
      slug: (productData.name || '').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      price: productData.price || 0,
      discountPrice: productData.discountPrice || null,
      stockQuantity: productData.stockQuantity || 0,
      soldCount: 0,
      avgRating: 5.0,
      reviewCount: 0,
      art: cat.art,
      tint: cat.tint,
      description: productData.description || '',
      isAvailable: productData.isAvailable ?? true,
      createdAt: new Date().toISOString(),
      imgs: productData.imgs || [],
    };
    memoryProducts.unshift(newProd);
    return newProd;
  },

  deleteProduct: async (id: number): Promise<boolean> => {
    memoryProducts = memoryProducts.filter((p) => p.id !== id);
    return true;
  },
};

