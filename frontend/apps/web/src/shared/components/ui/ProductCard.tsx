import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Product } from '@/shared/types';

export function ProductCard({ product: p }: { product: Product }) {
  return (
    <article className="group relative flex flex-col bg-[var(--surface)] border border-[var(--line)] rounded-[24px] overflow-hidden shadow-[var(--sh-1)] hover:shadow-[var(--sh-2)] hover:-translate-y-1 transition-all duration-250">
      
      {/* Image Tile */}
      <Link to={`/product/${p.id}`} className="block relative pt-[100%] rounded-t-[24px] overflow-hidden bg-gray-50/50">
        {p.isBestSeller && (
          <div className="absolute right-[52px] top-3 bg-[var(--volt)] text-[var(--on-volt)] px-3 py-1.5 rounded-full text-[12px] font-bold z-10 shadow-sm">
            Bán chạy
          </div>
        )}
        {p.discountPrice && (
          <div className="absolute left-3 top-3 bg-[#e13636] text-white px-3 py-1.5 rounded-full text-[12px] font-bold z-10 shadow-sm">
            -{Math.round((1 - p.discountPrice / p.price) * 100)}%
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center p-6 group-hover:scale-106 group-hover:-rotate-2 transition-transform duration-250">
          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain drop-shadow-md" />
        </div>
      </Link>

      {/* Favorite Button */}
      <button className="absolute right-3 top-3 w-[36px] h-[36px] rounded-full bg-white/80 backdrop-blur-md border border-[var(--line)] text-[var(--ink-2)] hover:text-[#e13636] hover:bg-white flex items-center justify-center shadow-sm transition-all z-10">
        <Heart size={18} />
      </button>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 md:p-4 pt-5">
        <div className="flex items-center gap-1.5 text-xs text-[var(--ink-2)] font-semibold mb-2">
          <Star size={14} className="fill-[var(--volt)] text-[var(--volt)]" />
          <span className="text-[var(--ink)]">{p.rating?.toFixed(1) || '0.0'}</span>
          {p.soldCount && (
            <>
              <span className="font-normal opacity-40 mx-1">•</span>
              <span className="font-normal opacity-80">Đã bán {p.soldCount}</span>
            </>
          )}
        </div>
        
        {p.categoryName && (
          <div className="text-[11px] font-medium text-[var(--volt)] uppercase tracking-wider mb-1">
            {p.categoryName}
          </div>
        )}
        
        <h3 className="font-bold text-[var(--ink)] text-lg leading-tight mb-4">
          <Link to={`/product/${p.id}`}>{p.name}</Link>
        </h3>
        
        <div className="flex items-end justify-between gap-2 mt-auto">
          <div className="flex flex-col">
            {p.discountPrice && (
              <s className="text-xs text-[var(--ink-3)]">{p.price.toLocaleString('vi-VN')}đ</s>
            )}
            <b className="text-[1.2rem] md:text-[1.35rem] text-[var(--ink)] font-extrabold tracking-tight">{(p.discountPrice || p.price).toLocaleString('vi-VN')}đ</b>
          </div>
          {/* Add to cart button */}
          <button className="w-[48px] h-[48px] rounded-full bg-[#2450D6] text-white flex items-center justify-center hover:bg-[#1C3FB3] hover:scale-105 transition-all shadow-md shrink-0" aria-label="Thêm vào giỏ">
            <ShoppingBag size={22} />
          </button>
        </div>
      </div>
    </article>
  );
}
