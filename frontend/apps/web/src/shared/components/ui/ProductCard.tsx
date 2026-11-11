import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingBag, Star, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';
import { useCartStore } from '@/shared/stores/cartStore';
import { useToastStore } from '@/shared/stores/toastStore';
import { wishlistApi } from '@/shared/api/wishlistApi';
import { useMyWishlist } from '@/shared/hooks/useMyWishlist';

import type { Product } from '@/shared/types';

export function ProductCard({ product: p }: { product: Product }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const { showToast } = useToastStore();
  const queryClient = useQueryClient();
  const wishlistQuery = useMyWishlist();
  const [isAdding, setIsAdding] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const handleAction = async (e: React.MouseEvent, actionName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để thêm món vào giỏ hàng', 'info');
      navigate('/login');
      return;
    }

    if (actionName === 'add-to-cart') {
      try {
        setIsAdding(true);
        await addToCart(p.id, 1);
        showToast(`Đã thêm “${p.name}” vào giỏ hàng`, 'success');
      } catch (err: any) {
        showToast(err?.message || 'Không thể thêm vào giỏ', 'error');
      } finally {
        setIsAdding(false);
      }
      return;
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để lưu món yêu thích', 'info');
      navigate('/login');
      return;
    }

    try {
      setIsTogglingFavorite(true);
      const result = await wishlistApi.toggle(p.id);
      await queryClient.invalidateQueries({ queryKey: ['my-wishlist', user?.id] });
      showToast(result.message, 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Không thể cập nhật món yêu thích', 'error');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const isFavorite = wishlistQuery.data?.some((item) => item.productId === p.id) ?? p.isFavorite ?? false;

  const imageSrc = p.thumbnailUrl || p.imageUrl || 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png';

  // Tính toán giá bán và giảm giá linh hoạt (tương thích cả backend và mock)
  let sellingPrice = p.price;
  let originalPrice: number | null = null;
  let discountPercent = 0;

  if (p.originalPrice && p.originalPrice > p.price) {
    sellingPrice = p.price;
    originalPrice = p.originalPrice;
    discountPercent = Math.round((1 - p.price / p.originalPrice) * 100);
  } else if (p.discountPrice && p.discountPrice < p.price) {
    sellingPrice = p.discountPrice;
    originalPrice = p.price;
    discountPercent = Math.round((1 - p.discountPrice / p.price) * 100);
  }

  const rating = Number(p.ratingAverage ?? p.avgRating ?? 0).toFixed(1);
  const soldDisplay = p.soldCountDisplay || (p.soldCount ? `Đã bán ${p.soldCount}` : null);

  return (
    <article className="group relative flex flex-col bg-[var(--surface)] border border-[var(--line)] rounded-[24px] overflow-hidden shadow-[var(--sh-1)] hover:shadow-[var(--sh-2)] hover:-translate-y-1 transition-all duration-250">
      
      {/* Image Tile */}
      <Link to={`/product/${p.slug || p.id}`} className="block relative pt-[100%] rounded-t-[24px] overflow-hidden bg-gray-50/50">
        {p.isBestSeller && (
          <div className="absolute right-[52px] top-3 bg-[var(--volt)] text-[var(--on-volt)] px-3 py-1.5 rounded-full text-[12px] font-bold z-10 shadow-sm">
            Bán chạy
          </div>
        )}
        {discountPercent > 0 && (
          <div className="absolute left-3 top-3 bg-[#e13636] text-white px-3 py-1.5 rounded-full text-[12px] font-bold z-10 shadow-sm">
            -{discountPercent}%
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center p-6 group-hover:scale-106 group-hover:-rotate-2 transition-transform duration-250">
          <img src={imageSrc} alt={p.name} className="w-full h-full object-contain drop-shadow-md" />
        </div>
      </Link>

      {/* Favorite Button */}
      <button 
        className="absolute right-3 top-3 w-[36px] h-[36px] rounded-full bg-white/80 backdrop-blur-md border border-[var(--line)] text-[var(--ink-2)] hover:text-[#e13636] hover:bg-white flex items-center justify-center shadow-sm transition-all z-10"
        type="button"
        aria-label={isFavorite ? `Xóa ${p.name} khỏi món yêu thích` : `Thêm ${p.name} vào món yêu thích`}
        aria-pressed={isFavorite}
        disabled={isTogglingFavorite}
        onClick={handleFavorite}
      >
        <Heart size={18} className={isFavorite ? 'fill-[#e13636] text-[#e13636]' : ''} />
      </button>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 md:p-4 pt-5">
        <div className="flex items-center gap-1.5 text-xs text-[var(--ink-2)] font-semibold mb-2">
          <Star size={14} className="fill-[var(--volt)] text-[var(--volt)]" />
          <span className="text-[var(--ink)]">{rating}</span>
          {soldDisplay && (
            <>
              <span className="font-normal opacity-40 mx-1">•</span>
              <span className="font-normal opacity-80">{soldDisplay}</span>
            </>
          )}
        </div>
        
        {p.categoryName && (
          <div className="text-[11px] font-medium text-[var(--volt)] uppercase tracking-wider mb-1">
            {p.categoryName}
          </div>
        )}
        
        <h3 className="font-bold text-[var(--ink)] text-lg leading-tight mb-4">
          <Link to={`/product/${p.slug || p.id}`}>{p.name}</Link>
        </h3>
        
        <div className="flex items-end justify-between gap-2 mt-auto">
          <div className="flex flex-col">
            {originalPrice && (
              <s className="text-xs text-[var(--ink-3)]">{originalPrice.toLocaleString('vi-VN')}đ</s>
            )}
            <b className="text-[1.2rem] md:text-[1.35rem] text-[var(--ink)] font-extrabold tracking-tight">{sellingPrice.toLocaleString('vi-VN')}đ</b>
          </div>
          {/* Add to cart button */}
          <button 
            className="w-[48px] h-[48px] rounded-full bg-[#2450D6] text-white flex items-center justify-center hover:bg-[#1C3FB3] hover:scale-105 transition-all shadow-md shrink-0 disabled:opacity-60" 
            aria-label="Thêm vào giỏ"
            disabled={isAdding}
            onClick={(e) => handleAction(e, 'add-to-cart')}
          >
            {isAdding ? <Loader2 size={20} className="animate-spin" /> : <ShoppingBag size={22} />}
          </button>
        </div>
      </div>
    </article>
  );
}
