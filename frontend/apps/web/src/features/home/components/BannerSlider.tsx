import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import type { Banner } from '@/shared/types';
import { isSafeUrl, sanitizeUrl } from '@/shared/utils/security';

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
        {banners.map((banner) => {
          const safeLink = sanitizeUrl(banner.linkUrl, { fallback: '#' });
          const safeImage = sanitizeUrl(banner.imageUrl, { fallback: '' });
          const isExternal = isSafeUrl(banner.linkUrl, { allowRelative: false });
          return (
            <SwiperSlide key={banner.id}>
              <a
                href={safeLink}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="block w-full h-[250px] md:h-[400px]"
              >
                <img
                  src={safeImage}
                  alt="Promo Banner"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </a>
            </SwiperSlide>
          );
        })}
        
        {/* Custom Navigation Buttons (Hidden on mobile, visible on hover on desktop) */}
        <div className="swiper-button-prev !text-white !hidden md:group-hover:!flex after:!text-2xl !bg-black/20 hover:!bg-black/50 !w-12 !h-12 !rounded-full transition-all"></div>
        <div className="swiper-button-next !text-white !hidden md:group-hover:!flex after:!text-2xl !bg-black/20 hover:!bg-black/50 !w-12 !h-12 !rounded-full transition-all"></div>
      </Swiper>
    </div>
  );
}
