import { BannerSlider } from '@/features/home/components/BannerSlider';
import { CategoryList } from '@/features/home/components/CategoryList';
import { VoucherList } from '@/features/home/components/VoucherList';
import { HeroSection } from '@/features/home/components/HeroSection';
import { ProductList } from '@/features/home/components/ProductList';
import { categoryApi } from '@/shared/api/categoryApi';
import { productApi } from '@/shared/api/productApi';
import { voucherApi } from '@/shared/api/voucherApi';
import { bannerApi } from '@/shared/api/bannerApi';
import { CACHE_TIME } from '@/shared/config/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

export function HomePage() {
  const {
    data: categories = [],
    isPending: isCategoriesPending,
    isError: isCategoriesError,
  } = useQuery({
    queryKey: ['active-categories'],
    queryFn: categoryApi.getActiveCategories,
    staleTime: CACHE_TIME.CATEGORIES,
  });

  const {
    data: bestSellersPage,
    isPending: isBestSellersPending,
    isError: isBestSellersError,
  } = useQuery({
    queryKey: ['best-selling-products'],
    queryFn: () => productApi.getProducts({ sort: 'bestSelling', size: 8 }),
    staleTime: CACHE_TIME.PRODUCTS,
  });

  const {
    data: availableVouchers = [],
    isPending: isVouchersPending,
    isError: isVouchersError,
  } = useQuery({
    queryKey: ['available-vouchers-home'],
    queryFn: () => voucherApi.getAvailableVouchers(),
    staleTime: CACHE_TIME.VOUCHERS,
  });

  const {
    data: activeBanners = [],
    isError: isBannersError,
  } = useQuery({
    queryKey: ['active-banners-home'],
    queryFn: bannerApi.getActiveBanners,
    staleTime: CACHE_TIME.BANNERS,
  });

  const bestSellers = bestSellersPage?.content ?? [];

  return (
    <div className="w-full pb-16">
      {/* 0. Hero Section */}
      <HeroSection featuredProduct={bestSellers[0]} />

      {/* 1. Banners Section */}
      <section className="container mx-auto px-4 mt-12 mb-12">
        {isBannersError ? (
          <p className="text-red-600" role="alert">Không thể tải banner lúc này.</p>
        ) : (
          <BannerSlider banners={activeBanners} />
        )}
      </section>

      {/* 2. Vouchers Section */}
      <section className="container mx-auto px-4 mb-12">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-[clamp(1.5rem,3vw,2.15rem)] font-bold text-[var(--ink)]">Ưu đãi đang chạy</h2>
            <p className="text-[var(--ink-2)] mt-1.5">Chạm vào banner để xem món, sao chép mã để dùng ở giỏ hàng.</p>
          </div>
          <Link to="/vouchers" className="hidden md:flex font-semibold text-[var(--ink)] items-center gap-1 border-b-[1.5px] border-[var(--volt)] pb-[1px] hover:border-[var(--ink)] transition-colors whitespace-nowrap">
            Xem tất cả
          </Link>
        </div>
        {isVouchersPending ? (
          <p className="text-[var(--ink-2)]">Đang tải ưu đãi...</p>
        ) : isVouchersError ? (
          <p className="text-red-600" role="alert">Không thể tải danh sách ưu đãi.</p>
        ) : availableVouchers.length > 0 ? (
          <VoucherList vouchers={availableVouchers} />
        ) : (
          <p className="text-[var(--ink-2)]">Hiện chưa có ưu đãi đang áp dụng.</p>
        )}
      </section>

      {/* 3. Categories Section */}
      <section className="container mx-auto px-4 mb-12">
        <div className="flex flex-col mb-5">
          <h2 className="text-[clamp(1.5rem,3vw,2.15rem)] font-bold text-[var(--ink)]">Khám phá danh mục</h2>
          <p className="text-[var(--ink-2)] mt-1.5">Đa dạng món ngon chờ bạn thưởng thức</p>
        </div>
        {isCategoriesPending ? (
          <p className="text-[var(--ink-2)]">Đang tải danh mục...</p>
        ) : isCategoriesError ? (
          <p className="text-red-600" role="alert">Không thể tải danh mục. Vui lòng thử lại sau.</p>
        ) : categories.length > 0 ? (
          <CategoryList categories={categories} />
        ) : (
          <p className="text-[var(--ink-2)]">Hiện chưa có danh mục nào.</p>
        )}
      </section>
      
      {/* 4. Best Sellers Section */}
      <section className="container mx-auto px-4 mb-12">
        {isBestSellersPending ? (
          <p className="text-[var(--ink-2)]">Đang tải danh sách món bán chạy...</p>
        ) : isBestSellersError ? (
          <p className="text-red-600" role="alert">Không thể tải danh sách món bán chạy.</p>
        ) : bestSellers.length > 0 ? (
          <ProductList
            title="Bán chạy nhất"
            subtitle="Những món được gọi nhiều nhất tại ThunderFood."
            products={bestSellers}
            viewAllLink="/menu?sort=best"
          />
        ) : (
          <div>
            <h2 className="text-[clamp(1.5rem,3vw,2.15rem)] font-bold text-[var(--ink)]">Bán chạy nhất</h2>
            <p className="text-[var(--ink-2)] mt-1.5">Hiện chưa có món bán chạy để hiển thị.</p>
          </div>
        )}
      </section>

      {/* 5. Info Section (Giao hàng) */}
      <section className="container mx-auto px-4 mb-12">
        <div className="bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-[clamp(24px,3vw,36px)] p-[clamp(28px,5vw,56px)] grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-[clamp(1.5rem,3vw,2.15rem)] font-bold">Đặt món và theo dõi đơn hàng trực tuyến</h2>
            <p className="text-[var(--ink-2)] mt-3 max-w-[44ch] leading-relaxed">
              Chọn món từ thực đơn, hoàn tất đặt hàng và theo dõi trạng thái đơn trong tài khoản của bạn.
            </p>
            <Link to="/menu" className="btn btn-primary mt-8 inline-flex">Xem thực đơn</Link>
          </div>
          {/* Bạn có thể đặt 1 hình ảnh hoặc bản đồ bên phải ở đây tương tự thiết kế HTML gốc nếu có */}
          <div className="hidden md:flex justify-end opacity-90">
            <img src="https://cdn-icons-png.flaticon.com/512/5021/5021153.png" alt="Hà Nội" className="w-[80%] max-w-[280px] object-contain drop-shadow-lg" />
          </div>
        </div>
      </section>
    </div>
  );
}
