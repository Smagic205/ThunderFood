import { BannerSlider } from '@/features/home/components/BannerSlider';
import { CategoryList } from '@/features/home/components/CategoryList';
import { VoucherList } from '@/features/home/components/VoucherList';
import { HeroSection } from '@/features/home/components/HeroSection';
import { ProductList } from '@/features/home/components/ProductList';
import { ReviewSection } from '@/features/home/components/ReviewSection';
import { mockBanners, mockCategories, mockVouchers, mockProducts } from '@/shared/api/mockData';
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="w-full pb-16">
      {/* 0. Hero Section */}
      <HeroSection />

      {/* 1. Banners Section */}
      <section className="container mx-auto px-4 mt-12 mb-12">
        <BannerSlider banners={mockBanners} />
      </section>

      {/* 2. Vouchers Section */}
      <section className="container mx-auto px-4 mb-12">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-[clamp(1.5rem,3vw,2.15rem)] font-bold text-[#12183A]">Ưu đãi đang chạy</h2>
            <p className="text-[#565D82] mt-1.5">Chạm vào banner để xem món, sao chép mã để dùng ở giỏ hàng.</p>
          </div>
          <Link to="/vouchers" className="hidden md:flex font-semibold text-[#12183A] items-center gap-1 border-b-[1.5px] border-[#FFB81C] pb-[1px] hover:border-[#12183A] transition-colors whitespace-nowrap">
            Xem tất cả
          </Link>
        </div>
        <VoucherList vouchers={mockVouchers} />
      </section>

      {/* 3. Categories Section */}
      <section className="container mx-auto px-4 mb-12">
        <div className="flex flex-col mb-5">
          <h2 className="text-[clamp(1.5rem,3vw,2.15rem)] font-bold text-[#12183A]">Khám phá danh mục</h2>
          <p className="text-[#565D82] mt-1.5">Đa dạng món ngon chờ bạn thưởng thức</p>
        </div>
        <CategoryList categories={mockCategories} />
      </section>
      
      {/* 4. Best Sellers Section */}
      <section className="container mx-auto px-4 mb-12">
        <ProductList 
          title="Bán chạy nhất" 
          subtitle="Những món được gọi nhiều nhất tại ThunderFood."
          products={mockProducts.filter(p => p.isBestSeller)}
          viewAllLink="/menu?sort=best"
        />
      </section>

      {/* 5. Info Section (Giao hàng) */}
      <section className="container mx-auto px-4 mb-12">
        <div className="bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-[clamp(24px,3vw,36px)] p-[clamp(28px,5vw,56px)] grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-[clamp(1.5rem,3vw,2.15rem)] font-bold">Giao tận nơi trong 12 quận nội thành</h2>
            <p className="text-[var(--ink-2)] mt-3 max-w-[44ch] leading-relaxed">
              Đồ ăn được đóng gói giữ nhiệt và giao bằng shipper riêng của ThunderFood. Bạn theo dõi hành trình đơn hàng ngay trong tài khoản.
            </p>
            <div className="flex flex-wrap gap-x-10 gap-y-6 mt-9">
              <div>
                <b className="block text-[clamp(1.5rem,3vw,1.8rem)] text-[var(--volt)]">~30 phút</b>
                <span className="text-[var(--ink-2)] text-sm">Thời gian giao trung bình</span>
              </div>
              <div>
                <b className="block text-[clamp(1.5rem,3vw,1.8rem)] text-[var(--volt)]">15.000đ</b>
                <span className="text-[var(--ink-2)] text-sm">Phí giao, miễn phí từ 200k</span>
              </div>
              <div>
                <b className="block text-[clamp(1.5rem,3vw,1.8rem)] text-[var(--volt)]">12 quận</b>
                <span className="text-[var(--ink-2)] text-sm">Phạm vi phục vụ</span>
              </div>
            </div>
          </div>
          {/* Bạn có thể đặt 1 hình ảnh hoặc bản đồ bên phải ở đây tương tự thiết kế HTML gốc nếu có */}
          <div className="hidden md:flex justify-end opacity-90">
            <img src="https://cdn-icons-png.flaticon.com/512/5021/5021153.png" alt="Hà Nội" className="w-[80%] max-w-[280px] object-contain drop-shadow-lg" />
          </div>
        </div>
      </section>

      {/* 6. Review Section (Khách hàng nói gì) */}
      <ReviewSection />
    </div>
  );
}
