import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import type { Banner } from '@/shared/types'; // We need to define this or use a mock

interface BannerSliderProps {
  banners: Banner[];
}

export function BannerSlider({ banners }: BannerSliderProps) {
  if (!banners || banners.length === 0) return null;

  return (
    <div className="w-full relative rounded-2xl overflow-hidden group shadow-lg">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={16}
        slidesPerView={1}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        pagination={{ clickable: true }}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        loop={true}
        className="w-full"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <a 
              href={banner.linkUrl || '#'} 
              className="block w-full h-[250px] md:h-[400px]"
            >
              <img 
                src={banner.imageUrl} 
                alt="Promo Banner" 
                className="w-full h-full object-cover"
              />
            </a>
          </SwiperSlide>
        ))}
        
        {/* Custom Navigation Buttons (Hidden on mobile, visible on hover on desktop) */}
        <div className="swiper-button-prev !text-white !hidden md:group-hover:!flex after:!text-2xl !bg-black/20 hover:!bg-black/50 !w-12 !h-12 !rounded-full transition-all"></div>
        <div className="swiper-button-next !text-white !hidden md:group-hover:!flex after:!text-2xl !bg-black/20 hover:!bg-black/50 !w-12 !h-12 !rounded-full transition-all"></div>
      </Swiper>
    </div>
  );
}
