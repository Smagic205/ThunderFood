import { Clock, Truck, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function HeroSection() {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    // Add play class after a short delay for animation
    const timer = setTimeout(() => setPlay(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="container mx-auto px-4 pt-6 md:pt-10">
      <div className={`hero ${play ? 'play' : ''} relative isolate overflow-hidden rounded-[24px] md:rounded-[36px] text-white`}
        style={{ background: 'radial-gradient(90% 120% at 88% 0%, var(--panel-2) 0%, var(--panel) 58%)' }}>

        {/* Lưới tia sét SVG mờ phía sau */}
        <svg className="hero-bolt absolute right-[2%] top-[-14%] h-[132%] w-auto -z-10 pointer-events-none" viewBox="0 0 210 300" aria-hidden="true">
          <path className="f" d="M105.5 0L0 170.5H95.5L84.5 300L210 110.5H114.5L134 0H105.5Z" />
          <path className="o" pathLength="1000" d="M105.5 0L0 170.5H95.5L84.5 300L210 110.5H114.5L134 0H105.5Z" />
        </svg>

        <div className="grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-6 items-center p-[clamp(28px,5.5vw,72px)]">
          <div>
            <h1 className="text-[clamp(2.35rem,5.4vw,4.4rem)] font-extrabold tracking-tight  leading-[1.02] text-balance font-['Bricolage_Grotesque']">
              Cảm xúc thăng hoa<br />Nâng tầm vị giác.
            </h1>
            <p className="mt-5 text-[clamp(1rem,1.5vw,1.15rem)] text-[#C7CEF2] max-w-[46ch]">
              Gà rán, burger, cơm và đồ uống nấu tới mỗi ngày. Giao trong nội thành Hà Nội, miễn phí giao hàng từ 200.000đ.
            </p>
            <div className="flex gap-3 flex-wrap mt-8">
              <Link to="/menu" className="btn btn-primary btn-lg">
                Đặt món ngay
              </Link>
              <Link to="/menu?cat=1" className="btn btn-onpanel btn-lg">
                Xem combo
              </Link>
            </div>

            <div className="flex gap-x-6 gap-y-3 flex-wrap mt-9 text-[#B9C0EA] text-sm">
              <span className="flex items-center gap-2">
                <Clock size={18} className="text-[var(--volt)]" />
                Mở cửa 09:00 đến 22:00
              </span>
              <span className="flex items-center gap-2">
                <Truck size={18} className="text-[var(--volt)]" />
                Khoảng 30 phút nội thành
              </span>
              <span className="flex items-center gap-2">
                <Shield size={18} className="text-[var(--volt)]" />
                COD, VNPay, MoMo
              </span>
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center min-h-[340px] md:min-h-[420px] mt-8 md:mt-0 pb-14 md:pb-18">
            {/* Ảnh minh họa combo */}
            <img
              src="https://res.cloudinary.com/pmbasb2y/image/upload/c_crop,x_745,y_175,w_915,h_985/v1793527306/LogoThunderFood-Photoroom.png"
              alt="Combo Sấm Sét"
              className="w-[min(85%,300px)] sm:w-[340px] md:w-[380px] lg:w-[420px] h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:scale-105 select-none"
            />

            <Link
              to="/product/combo-sam-set"
              className="absolute bottom-[-10px] md:bottom-[0px] left-1/2 -translate-x-1/2 w-[max-content] max-w-[95%] flex items-center gap-4 sm:gap-5 p-4 sm:p-5 pr-6 sm:pr-8 rounded-[24px] sm:rounded-[28px] bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-2xl hover:scale-[1.02]"
            >
              <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] sm:rounded-[20px] bg-[var(--volt)] text-[var(--on-volt)] flex items-center justify-center shrink-0">
                <Zap size={28} className="sm:w-8 sm:h-8" />
              </span>
              <span className="flex flex-col">
                <small className="block text-[#B9C0EA] text-sm sm:text-base font-medium tracking-wide">Bán chạy nhất</small>
                <b className="text-[18px] sm:text-[20px] text-white">Combo Sấm Sét <span className="text-[var(--volt)] ml-1.5 font-extrabold text-[20px] sm:text-[22px]">189.000đ</span></b>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
