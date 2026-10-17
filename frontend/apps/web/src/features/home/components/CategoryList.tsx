import type { Category } from '@/shared/types';
import {
  Coffee,
  CupSoda,
  Drumstick,
  IceCreamCone,
  Pizza,
  Popcorn,
  Salad,
  Sandwich,
  Soup,
  Utensils,
  UtensilsCrossed,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  if (!categories || categories.length === 0) return null;

  const getCategoryIcon = (category: Category, className: string) => {
    const normalized = `${category.slug || ''} ${category.name}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .toLowerCase()
      .replace(/[-_]+/g, ' ');

    if (/\b(banh mi|sandwich|burger|hamburger)\b/.test(normalized)) {
      return <Sandwich className={className} />;
    }
    if (/\b(ga|chicken|drumstick)\b/.test(normalized)) {
      return <Drumstick className={className} />;
    }
    if (/\bpizza\b/.test(normalized)) {
      return <Pizza className={className} />;
    }
    if (/\b(coffee|cafe|ca phe)\b/.test(normalized)) {
      return <Coffee className={className} />;
    }
    if (/\b(do uong|drink|beverage|nuoc|tra|soda|milk tea)\b/.test(normalized)) {
      return <CupSoda className={className} />;
    }
    if (/\b(an kem|snack|fries|khoai|popcorn)\b/.test(normalized)) {
      return <Popcorn className={className} />;
    }
    if (/\b(trang mieng|dessert|cake|banh|kem|sundae|ice cream)\b/.test(normalized)) {
      return <IceCreamCone className={className} />;
    }
    if (/\b(com|rice|mi|noodle|pho|bun|soup)\b/.test(normalized)) {
      return <Soup className={className} />;
    }
    if (/\b(salad|rau|vegetable)\b/.test(normalized)) {
      return <Salad className={className} />;
    }
    if (/\b(combo|set meal)\b/.test(normalized)) {
      return <UtensilsCrossed className={className} />;
    }

    return <Utensils className={className} />;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {categories.map((cat) => (
        <Link 
          key={cat.id} 
          to={`/menu?cat=${cat.id}`}
          className="group bg-[var(--surface)] rounded-2xl p-4 flex flex-col items-center text-center shadow-sm border border-[var(--line)] hover:shadow-md hover:border-transparent hover:ring-2 hover:ring-[var(--volt)] transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] group-hover:bg-[var(--volt-soft)] flex items-center justify-center mb-3 transition-colors text-[var(--volt)]">
            {cat.imageUrl ? (
              <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 object-contain" />
            ) : (
              getCategoryIcon(cat, "w-8 h-8 opacity-80")
            )}
          </div>
          <h3 className="font-semibold text-[var(--ink)] mb-1 line-clamp-1">{cat.name}</h3>
          <p className="text-xs text-[var(--ink-3)] line-clamp-2">{cat.description || 'Khám phá ngay'}</p>
        </Link>
      ))}
      
    </div>
  );
}
