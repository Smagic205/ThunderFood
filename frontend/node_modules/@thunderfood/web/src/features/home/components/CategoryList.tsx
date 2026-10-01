import type { Category } from '@/shared/types';
import { Utensils, Coffee, Pizza, IceCream } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  if (!categories || categories.length === 0) return null;

  const getCategoryIcon = (slug: string, className: string) => {
    switch (slug) {
      case 'do-uong':
      case 'drink':
        return <Coffee className={className} />;
      case 'fast-food':
      case 'burger':
      case 'pizza':
        return <Pizza className={className} />;
      case 'trang-mieng':
        return <IceCream className={className} />;
      default:
        return <Utensils className={className} />;
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {categories.map((cat) => (
        <Link 
          key={cat.id} 
          to={`/menu?category=${cat.id}`}
          className="group bg-white rounded-2xl p-4 flex flex-col items-center text-center shadow-sm border border-[#E0E3F0] hover:shadow-md hover:border-transparent hover:ring-2 hover:ring-[#FFB81C] transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-[#F3F4FA] group-hover:bg-[#FFF1CC] flex items-center justify-center mb-3 transition-colors text-[var(--volt)]">
            {cat.imageUrl ? (
              <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 object-contain" />
            ) : (
              getCategoryIcon(cat.slug || '', "w-8 h-8 opacity-80")
            )}
          </div>
          <h3 className="font-semibold text-[#12183A] mb-1 line-clamp-1">{cat.name}</h3>
          <p className="text-xs text-[#868CAD] line-clamp-2">{cat.description || 'Khám phá ngay'}</p>
        </Link>
      ))}
      
    </div>
  );
}
