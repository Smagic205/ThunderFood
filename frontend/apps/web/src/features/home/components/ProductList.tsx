import { Link } from 'react-router-dom';
import { ProductCard } from '@/shared/components/ui/ProductCard';
import type { Product } from '@/shared/types';

interface ProductListProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllLink?: string;
}

export function ProductList({ title, subtitle, products, viewAllLink }: ProductListProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[clamp(1.5rem,3vw,2.15rem)] font-bold text-[#12183A]">{title}</h2>
          {subtitle && <p className="mt-1.5 text-[#565D82]">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link to={viewAllLink} className="hidden md:flex font-semibold text-[#12183A] items-center gap-1 border-b-[1.5px] border-[#FFB81C] pb-[1px] hover:border-[#12183A] transition-colors">
            Xem tất cả
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(232px,1fr))] gap-3 md:gap-5">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
