import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Sliders } from 'lucide-react';
import { mockProducts, mockCategories } from '@/shared/api/mockData';
import { ProductCard } from '@/shared/components/ui/ProductCard';
import type { Product } from '@/shared/types';

const PRICE_F = {
  all: { label: 'Tất cả', fn: () => true },
  lt50: { label: 'Dưới 50.000₫', fn: (p: Product) => (p.discountPrice || p.price) < 50000 },
  m100: { label: '50.000₫ đến 100.000₫', fn: (p: Product) => { const price = p.discountPrice || p.price; return price >= 50000 && price <= 100000; } },
  m200: { label: '100.000₫ đến 200.000₫', fn: (p: Product) => { const price = p.discountPrice || p.price; return price > 100000 && price <= 200000; } },
  gt200: { label: 'Trên 200.000₫', fn: (p: Product) => (p.discountPrice || p.price) > 200000 },
} as const;

const SORTS = {
  best: { label: 'Bán chạy nhất', fn: (a: Product, b: Product) => b.soldCount - a.soldCount },
  rating: { label: 'Đánh giá cao', fn: (a: Product, b: Product) => (b.avgRating || 0) - (a.avgRating || 0) },
  asc: { label: 'Giá tăng dần', fn: (a: Product, b: Product) => (a.discountPrice || a.price) - (b.discountPrice || b.price) },
  desc: { label: 'Giá giảm dần', fn: (a: Product, b: Product) => (b.discountPrice || b.price) - (a.discountPrice || a.price) },
  new: { label: 'Mới nhất', fn: (a: Product, b: Product) => b.id - a.id },
} as const;

export const MenuPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL
  const q = searchParams.get('q') || '';
  const cat = Number(searchParams.get('cat')) || 0;
  const sort = searchParams.get('sort') || 'best';
  const price = searchParams.get('price') || 'all';
  const rating = Number(searchParams.get('rating')) || 0;
  const best = searchParams.get('best') === 'true';
  const stock = searchParams.get('stock') === 'true';

  const updateFilter = (key: string, value: string | number | boolean | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === null || value === '' || value === 0 || value === 'all' || value === false) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      return next;
    });
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (price !== 'all') count++;
    if (rating > 0) count++;
    if (best) count++;
    if (stock) count++;
    return count;
  }, [price, rating, best, stock]);

  // Derived filtered & sorted products
  const filteredProducts = useMemo(() => {
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
    const query = normalize(q.trim());
    
    return mockProducts.filter(p => {
      // Category match
      if (cat > 0 && p.categoryId !== cat) return false;
      
      // Keyword match
      if (query) {
        const catName = mockCategories.find(c => c.id === p.categoryId)?.name || '';
        if (!normalize(p.name).includes(query) && !normalize(catName).includes(query)) return false;
      }

      // Price match
      if (PRICE_F[price as keyof typeof PRICE_F]) {
        if (!PRICE_F[price as keyof typeof PRICE_F].fn(p)) return false;
      }

      // Rating match
      if (rating > 0 && (p.avgRating || 0) < rating) return false;

      // Best seller match
      if (best && p.soldCount < 2000) return false;

      // Stock match
      if (stock && (!p.isAvailable || p.stockQuantity <= 0)) return false;

      return true;
    }).sort(SORTS[sort as keyof typeof SORTS]?.fn || SORTS.best.fn);
  }, [q, cat, sort, price, rating, best, stock]);

  const filterPanelJSX = (
    <>
      <div className="fgroup">
        <h4>Khoảng giá</h4>
        <div className="fopts">
          {Object.entries(PRICE_F).map(([k, v]) => (
            <button
              key={k}
              className={`chip ${price === k ? 'on' : ''}`}
              onClick={() => updateFilter('price', k)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className="fgroup">
        <h4>Đánh giá</h4>
        <div className="fopts">
          {[
            { v: 0, l: 'Tất cả' },
            { v: 4, l: 'Từ 4 sao' },
            { v: 4.5, l: 'Từ 4,5 sao' }
          ].map(opt => (
            <button
              key={opt.v}
              className={`chip ${rating === opt.v ? 'on' : ''}`}
              onClick={() => updateFilter('rating', opt.v)}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>
      <div className="fgroup">
        <h4>Khác</h4>
        <label className="check">
          <input
            type="checkbox"
            checked={best}
            onChange={(e) => updateFilter('best', e.target.checked)}
          />
          Món bán chạy
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={stock}
            onChange={(e) => updateFilter('stock', e.target.checked)}
          />
          Chỉ hiện món còn hàng
        </label>
      </div>
      <div className="fgroup">
        <button className="btn btn-ghost btn-block" onClick={resetFilters}>
          Xóa bộ lọc
        </button>
      </div>
    </>
  );

  return (
    <div className="container page">
      <div className="page-h">
        <div>
          <h1>Thực đơn</h1>
          <p className="muted" style={{ marginTop: '6px' }}>
            Nấu tươi khi có đơn, giao nóng trong khoảng 30 phút.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="input-ic hide-sm">
          <Search size={18} className="ic" />
          <input
            className="input"
            type="search"
            placeholder="Tìm theo tên món…"
            value={q}
            onChange={(e) => updateFilter('q', e.target.value)}
            aria-label="Tìm theo tên món"
          />
        </div>
        <select
          className="select"
          value={sort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          aria-label="Sắp xếp"
        >
          {Object.entries(SORTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <button
          className="btn btn-ghost only-mob-lg"
          style={{ position: 'relative' }}
          // TODO: Open modal for mobile filter
        >
          <Sliders size={18} />
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="tag gold" style={{ marginLeft: '2px' }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="cat-tabs" role="group" aria-label="Danh mục">
        <button
          className={`chip ${cat === 0 ? 'on' : ''}`}
          onClick={() => updateFilter('cat', 0)}
          aria-pressed={cat === 0}
        >
          Tất cả
        </button>
        {mockCategories.filter(c => c.isActive).map(c => (
          <button
            key={c.id}
            className={`chip ${cat === c.id ? 'on' : ''}`}
            onClick={() => updateFilter('cat', c.id)}
            aria-pressed={cat === c.id}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="menu-layout">
        <aside className="filters card desk" aria-label="Bộ lọc">
          {filterPanelJSX}
        </aside>
        
        <div>
          <div className="res-info" aria-live="polite">
            {filteredProducts.length} món
            {q ? ` cho “${q}”` : ''}
          </div>
          
          {filteredProducts.length > 0 ? (
            <div className="pgrid">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="empty card" style={{ gridColumn: '1/-1' }}>
              <div className="art-wrap">
                <span style={{ fontSize: '48px' }}>🍜</span>
              </div>
              <h3>Không tìm thấy món phù hợp</h3>
              <p>Thử đổi từ khóa hoặc bỏ bớt bộ lọc.</p>
              <button className="btn btn-primary" onClick={resetFilters}>
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
