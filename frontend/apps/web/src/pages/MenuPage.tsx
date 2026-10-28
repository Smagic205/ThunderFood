import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Sliders, X } from 'lucide-react';
import { categoryApi } from '@/shared/api/categoryApi';
import { productApi, type GetProductsParams } from '@/shared/api/productApi';
import { ProductCard } from '@/shared/components/ui/ProductCard';
import { Pagination } from '@/shared/components/ui/Pagination';
import { useQuery } from '@tanstack/react-query';

const PAGE_SIZE = 12;

/* ─── Các tùy chọn khoảng giá — key khớp backend priceRange ─── */
const PRICE_OPTIONS = [
  { key: 'all',  label: 'Tất cả' },
  { key: 'lt50', label: 'Dưới 50.000₫' },
  { key: 'm100', label: '50.000₫ – 100.000₫' },
  { key: 'm200', label: 'Trên 100.000₫ – 200.000₫' },
  { key: 'gt200', label: 'Trên 200.000₫' },
] as const;

/* ─── Các tùy chọn đánh giá — value khớp backend ratingRange / minRating ─── */
const RATING_OPTIONS = [
  { key: '0',     label: 'Tất cả',    backendRange: undefined, backendMin: undefined },
  { key: 'above4', label: 'Từ 4 sao', backendRange: 'above4',  backendMin: undefined },
  { key: '4.5',   label: 'Từ 4,5 sao', backendRange: undefined, backendMin: 4.5 },
] as const;

/* ─── Các tùy chọn sắp xếp — value khớp backend sort ─── */
const SORT_OPTIONS = [
  { key: 'bestSelling',   label: 'Bán chạy nhất' },
  { key: 'rating',        label: 'Đánh giá cao' },
  { key: 'priceAsc',      label: 'Giá tăng dần' },
  { key: 'priceDesc',     label: 'Giá giảm dần' },
  { key: 'newest',        label: 'Mới nhất' },
  { key: 'discountDesc',  label: 'Ưu đãi nhiều nhất' },
] as const;

type MenuSort = (typeof SORT_OPTIONS)[number]['key'];

const LEGACY_SORTS: Record<string, MenuSort> = {
  best: 'bestSelling',
  asc: 'priceAsc',
  desc: 'priceDesc',
  new: 'newest',
};

const normalizeSort = (value: string): MenuSort => {
  const normalized = LEGACY_SORTS[value] ?? value;
  return SORT_OPTIONS.find(option => option.key === normalized)?.key ?? 'bestSelling';
};

export const MenuPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') || '');
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!isFilterOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFilterOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isFilterOpen]);

  /* ─── Categories ─── */
  const {
    data: categories = [],
    isPending: isCategoriesPending,
    isError: isCategoriesError,
  } = useQuery({
    queryKey: ['active-categories'],
    queryFn: categoryApi.getActiveCategories,
  });

  /* ─── Parse filter state from URL ─── */
  const q          = searchParams.get('q') || '';
  const rawCategory = searchParams.get('cat') || '';
  const categoryId = /^\d+$/.test(rawCategory) && Number(rawCategory) > 0
    ? Number(rawCategory)
    : undefined;
  const catSlug    = categoryId ? '' : rawCategory;      // hỗ trợ cả link cũ dùng ID và link mới dùng slug
  const sort       = normalizeSort(searchParams.get('sort') || 'bestSelling');
  const priceRange = searchParams.get('price') || 'all';
  const ratingKey  = searchParams.get('rating') || '0';
  const best       = searchParams.get('best') === 'true';
  const discount   = searchParams.get('discount') === 'true';
  const page       = Math.max(1, Number(searchParams.get('page')) || 1);

  // Keep the input independent from URL updates while an IME (Vietnamese, Chinese, etc.)
  // is composing text. Sync URL/search results only after typing pauses.
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    if (isComposing || searchInput === q) return;

    const timeout = window.setTimeout(() => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (searchInput.trim()) next.set('q', searchInput);
        else next.delete('q');
        next.delete('page');
        return next;
      });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [isComposing, searchInput, q, setSearchParams]);

  /* ─── Build backend params ─── */
  const ratingOption = RATING_OPTIONS.find(r => r.key === ratingKey) || RATING_OPTIONS[0];

  const apiParams = useMemo<GetProductsParams>(() => {
    const params: GetProductsParams = {
      page,
      size: PAGE_SIZE,
      sort,
    };

    // Keyword
    if (q.trim()) params.keyword = q.trim();

    // Category slug
    if (categoryId) params.categoryId = categoryId;
    else if (catSlug) params.categorySlug = catSlug;

    // Price range
    if (priceRange !== 'all') params.priceRange = priceRange;

    // Rating
    if (ratingOption.backendRange) params.ratingRange = ratingOption.backendRange;
    if (ratingOption.backendMin)   params.minRating   = ratingOption.backendMin;

    // Best seller (soldCount >= 100 theo backend, nhưng ta giữ label "Bán chạy" giống mẫu)
    if (best) params.bestSeller = true;

    // Ưu đãi (chỉ món có giảm giá)
    if (discount) params.hasDiscount = true;

    return params;
  }, [page, sort, q, categoryId, catSlug, priceRange, ratingOption, best, discount]);

  /* ─── Fetch products — toàn bộ filter/sort đã ủy quyền cho backend ─── */
  const {
    data: productsPage,
    isPending: isProductsPending,
    isError: isProductsError,
    error: productsError,
  } = useQuery({
    queryKey: ['products-menu', apiParams],
    queryFn: () => productApi.getProducts(apiParams),
  });

  const products = productsPage?.content ?? [];

  /* ─── URL helpers ─── */
  const updateFilter = (key: string, value: string | number | boolean | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (
        value === null || value === '' || value === 0 ||
        value === 'all' || value === false || value === '0'
      ) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      // Reset về trang 1 khi đổi filter
      if (key !== 'page') next.delete('page');
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (newPage <= 1) next.delete('page');
      else next.set('page', String(newPage));
      return next;
    });
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  /* ─── Badge đếm filter đang bật ─── */
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (priceRange !== 'all') count++;
    if (ratingKey !== '0') count++;
    if (best) count++;
    if (discount) count++;
    return count;
  }, [priceRange, ratingKey, best, discount]);

  /* ─── Filter panel (desktop sidebar + mobile dialog) ─── */
  const filterPanelJSX = (
    <>
      <div className="fgroup">
        <h4>Khoảng giá</h4>
        <div className="fopts">
          {PRICE_OPTIONS.map(opt => (
            <button
              key={opt.key}
              className={`chip ${priceRange === opt.key ? 'on' : ''}`}
              onClick={() => updateFilter('price', opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="fgroup">
        <h4>Đánh giá</h4>
        <div className="fopts">
          {RATING_OPTIONS.map(opt => (
            <button
              key={opt.key}
              className={`chip ${ratingKey === opt.key ? 'on' : ''}`}
              onClick={() => updateFilter('rating', opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="fgroup">
        <h4>Khác</h4>
        <label className="check">
          <input
            type="checkbox"
            checked={discount}
            onChange={(e) => updateFilter('discount', e.target.checked)}
          />
          Đang giảm giá
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={best}
            onChange={(e) => updateFilter('best', e.target.checked)}
          />
          Món bán chạy
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

      {/* ─── Toolbar: search + sort + mobile filter button ─── */}
      <div className="toolbar">
        <div className="input-ic hide-sm">
          <Search size={18} className="ic" />
          <input
            className="input"
            type="search"
            placeholder="Tìm theo tên món…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={(e) => {
              setSearchInput(e.currentTarget.value);
              setIsComposing(false);
            }}
            aria-label="Tìm theo tên món"
          />
        </div>
        <select
          className="select"
          value={sort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          aria-label="Sắp xếp"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          className="btn btn-ghost only-mob-lg"
          style={{ position: 'relative' }}
          type="button"
          aria-expanded={isFilterOpen}
          aria-haspopup="dialog"
          onClick={() => setIsFilterOpen(true)}
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

      {/* ─── Category tabs ─── */}
      <div className="cat-tabs" role="group" aria-label="Danh mục">
        <button
          className={`chip ${catSlug === '' && !categoryId ? 'on' : ''}`}
          onClick={() => updateFilter('cat', '')}
          aria-pressed={catSlug === '' && !categoryId}
        >
          Tất cả
        </button>
        {isCategoriesPending && <span className="muted">Đang tải danh mục...</span>}
        {isCategoriesError && <span className="text-red-600" role="alert">Không thể tải danh mục.</span>}
        {categories.map(c => (
          <button
            key={c.id}
            className={`chip ${categoryId === c.id || Boolean(catSlug && catSlug === c.slug) ? 'on' : ''}`}
            onClick={() => updateFilter('cat', c.slug || String(c.id))}
            aria-pressed={categoryId === c.id || Boolean(catSlug && catSlug === c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* ─── Main content: sidebar + product grid ─── */}
      <div className="menu-layout">
        <aside className="filters card desk" aria-label="Bộ lọc">
          {filterPanelJSX}
        </aside>

        <div>
          <div className="res-info" aria-live="polite">
            {!isProductsPending && !isProductsError && (
              <>
                {productsPage?.pagination?.totalElements ?? 0} món
                {q ? ` cho "${q}"` : ''}
              </>
            )}
          </div>

          {isProductsPending ? (
            <div className="empty card" role="status">Đang tải thực đơn...</div>
          ) : isProductsError ? (
            <div className="empty card" role="alert">
              <h3>Không thể tải thực đơn</h3>
              <p>{productsError instanceof Error ? productsError.message : 'Vui lòng thử lại sau.'}</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="pgrid">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Thanh phân trang */}
              {productsPage?.pagination && (
                <Pagination
                  page={productsPage.pagination.page}
                  totalPages={productsPage.pagination.totalPages}
                  totalElements={productsPage.pagination.totalElements}
                  size={productsPage.pagination.size}
                  onPageChange={handlePageChange}
                />
              )}
            </>
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

      {isFilterOpen && (
        <div
          className="menu-filter-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsFilterOpen(false);
          }}
        >
          <section
            className="menu-filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-filter-title"
          >
            <header className="menu-filter-header">
              <h2 id="menu-filter-title">Bộ lọc</h2>
              <button
                className="ibtn"
                type="button"
                aria-label="Đóng bộ lọc"
                onClick={() => setIsFilterOpen(false)}
              >
                <X size={20} />
              </button>
            </header>
            <div className="menu-filter-body">{filterPanelJSX}</div>
            <footer className="menu-filter-footer">
              <button className="btn btn-primary btn-block" type="button" onClick={() => setIsFilterOpen(false)}>
                Xem {productsPage?.pagination?.totalElements ?? 0} món
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};
