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
          <path className="f" d="M105.5 0L0 170.5H95.5L84.5 300L210 110.5H114.5L134 0H105.5Z"/>
          <path className="o" pathLength="1000" d="M105.5 0L0 170.5H95.5L84.5 300L210 110.5H114.5L134 0H105.5Z"/>
        </svg>

        <div className="grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-6 items-center p-[clamp(28px,5.5vw,72px)]">
          <div>
            <h1 className="text-[clamp(2.35rem,5.4vw,4.4rem)] font-extrabold tracking-tight leading-[1.02] text-balance font-['Bricolage_Grotesque']">
              Giao nhanh như chớp.<br/>Giòn tan như sấm.
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
          
          <div className="relative flex flex-col items-center justify-center min-h-[300px] mt-8 md:mt-0 pb-16 md:pb-24">
            {/* Ảnh minh họa combo */}
            <img src="https://cdn-icons-png.flaticon.com/512/3480/3480823.png" alt="Combo" className="w-[min(80%,340px)] aspect-square drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]" />
            
            <Link to="/product/1" className="absolute bottom-[-10px] md:bottom-[0px] left-1/2 -translate-x-1/2 w-[max-content] flex items-center gap-5 p-5 pr-8 rounded-[28px] bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors shadow-2xl">
              <span className="w-16 h-16 rounded-[20px] bg-[var(--volt)] text-[var(--on-volt)] flex items-center justify-center">
                <Zap size={32} />
              </span>
              <span className="flex flex-col">
                <small className="block text-[#B9C0EA] text-base font-medium tracking-wide">Bán chạy nhất</small>
                <b className="text-[20px] text-white">Combo Sấm Sét <span className="text-[var(--volt)] ml-1.5 font-extrabold text-[22px]">189.000đ</span></b>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
