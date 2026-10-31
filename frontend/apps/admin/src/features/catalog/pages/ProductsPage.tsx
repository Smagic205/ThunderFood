import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { catalogApi } from '../api/catalogApi';
import { ProductTile } from '../components/ProductTile';
import { ProductFormDrawer } from '../components/ProductFormDrawer';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import type { Product, Category, ProductStockFilter } from '../types';

/** Tạo danh sách số trang có dấu rút gọn (...) */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | '...')[] = [];
  if (current <= 3) {
    pages.push(1, 2, 3, 4, '...', total);
  } else if (current >= total - 2) {
    pages.push(1, '...', total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
}

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number>(0);
  const [sort, setSort] = useState<string>('bestSelling');
  const [stockFilter, setStockFilter] = useState<ProductStockFilter>('all');

  // Phân trang state (1-based từ backend)
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(10);

  // Modal / Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Debounce tìm kiếm (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Queries
  const {
    data: productData,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
  } = useQuery({
    queryKey: ['admin-products', { page, size, categoryId: selectedCatId, keyword: debouncedKeyword, sort }],
    queryFn: () =>
      catalogApi.getProducts({
        page,
        size,
        categoryId: selectedCatId > 0 ? selectedCatId : undefined,
        keyword: debouncedKeyword,
        sort,
      }),
    placeholderData: keepPreviousData,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: catalogApi.getCategories,
  });

  const products = productData?.content || [];
  const pagination = productData?.pagination || {
    page: 1,
    size: 10,
    totalElements: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Mutations
  const saveProductMutation = useMutation({
    mutationFn: (data: Partial<Product>) => catalogApi.saveProduct(data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      showToast(editingProduct ? `Đã lưu thay đổi món “${saved.name}”` : `Đã thêm món mới “${saved.name}”`);
      setIsDrawerOpen(false);
    },
    onError: (err: any) => {
      showToast(err?.message || 'Có lỗi xảy ra khi lưu món ăn');
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => catalogApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      showToast('Đã xóa món ăn khỏi thực đơn');
      setDeletingProduct(null);
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể xóa món ăn');
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: number; isAvailable: boolean }) =>
      catalogApi.toggleProductAvailability(id, isAvailable),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      showToast(vars.isAvailable ? 'Đã hiển thị món trên cửa hàng' : 'Đã ẩn món khỏi thực đơn');
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể cập nhật trạng thái món ăn');
    },
  });

  // Category map
  const categoryMap = useMemo(() => {
    return new Map<number, Category>(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Client-side stock filter nếu người dùng chọn
  const displayedProducts = useMemo(() => {
    if (stockFilter === 'all') return products;
    return products.filter((p) => {
      if (stockFilter === 'in') return p.isAvailable && p.stockQuantity > 0;
      if (stockFilter === 'out') return p.isAvailable && p.stockQuantity <= 0;
      if (stockFilter === 'hidden') return !p.isAvailable;
      return true;
    });
  }, [products, stockFilter]);

  const formatVnd = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  const handleOpenNew = () => {
    setEditingProduct(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = async (p: Product) => {
    try {
      const fullDetail = await catalogApi.getProductById(p.id);
      setEditingProduct(fullDetail || p);
    } catch {
      setEditingProduct(p);
    }
    setIsDrawerOpen(true);
  };

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1E2238',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
            padding: '12px 20px',
            borderRadius: '14px',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Check size={18} color="var(--volt, #FFC107)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header (ahead) */}
      <div className="ah">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0 }}>Quản lý món ăn</h2>
            {isProductsFetching && !isProductsLoading && (
              <Loader2 size={16} className="spin" style={{ color: 'var(--volt, #FFC107)' }} />
            )}
          </div>
          <p>
            Tổng cộng <b>{pagination.totalElements}</b> món ăn trong cơ sở dữ liệu.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleOpenNew}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Thêm món
        </button>
      </div>

      {/* Main Panel */}
      <div className="card panel-t">
        {/* Filters Bar */}
        <div
          className="filters-bar"
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Tìm kiếm */}
          <div className="input-ic" style={{ flex: '1 1 240px', maxWidth: '340px' }}>
            <Search size={18} className="muted" />
            <input
              className="input"
              type="search"
              placeholder="Tìm theo tên món..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm món"
            />
          </div>

          {/* Lọc danh mục */}
          <select
            className="select"
            value={selectedCatId}
            onChange={(e) => {
              setSelectedCatId(Number(e.target.value));
              setPage(1);
            }}
            style={{ width: 'auto', minWidth: '160px' }}
            aria-label="Danh mục"
          >
            <option value={0}>Tất cả danh mục ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sắp xếp */}
          <select
            className="select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            style={{ width: 'auto', minWidth: '150px' }}
            aria-label="Sắp xếp"
          >
            <option value="bestSelling">Bán chạy nhất</option>
            <option value="newest">Mới nhất</option>
            <option value="rating">Đánh giá cao</option>
            <option value="priceAsc">Giá: Thấp đến cao</option>
            <option value="priceDesc">Giá: Cao đến thấp</option>
          </select>

          {/* Tình trạng hàng */}
          <select
            className="select"
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value as ProductStockFilter);
              setPage(1);
            }}
            style={{ width: 'auto', minWidth: '140px' }}
            aria-label="Tình trạng"
          >
            <option value="all">Mọi tình trạng</option>
            <option value="in">Còn hàng</option>
            <option value="out">Hết hàng</option>
            <option value="hidden">Đang ẩn</option>
          </select>
        </div>

        {/* Products Table */}
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Món</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Đã bán</th>
                <th>Hiển thị</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isProductsLoading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty" style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <Loader2 size={28} className="spin" style={{ color: 'var(--volt, #FFC107)' }} />
                      <p className="muted" style={{ margin: 0 }}>Đang tải danh sách món ăn từ máy chủ…</p>
                    </div>
                  </td>
                </tr>
              ) : displayedProducts.length > 0 ? (
                displayedProducts.map((p) => {
                  const cat = categoryMap.get(p.categoryId);
                  const displayCatName = p.categoryName || cat?.name || 'Chưa phân loại';
                  const isDiscounted = p.discountPrice !== null && p.discountPrice < p.price;
                  const discountPercent = isDiscounted
                    ? Math.round((1 - p.discountPrice! / p.price) * 100)
                    : 0;

                  return (
                    <tr key={p.id}>
                      <td className="td-main">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <ProductTile
                            art={p.art || cat?.art}
                            tint={p.tint || cat?.tint}
                            imageUrl={p.imgs?.[0] || p.thumbnailUrl || null}
                            name={p.name}
                            size="xs"
                          />
                          <div style={{ minWidth: 0 }}>
                            <b style={{ color: 'var(--ink)', display: 'block' }}>{p.name}</b>
                            <small className="muted">
                              #{p.id} · {p.slug ? p.slug.slice(0, 24) : ''}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td data-label="Danh mục">
                        <span style={{ color: 'var(--ink)' }}>{displayCatName}</span>
                      </td>

                      <td data-label="Giá">
                        <div>
                          {isDiscounted ? (
                            <div>
                              <b style={{ color: 'var(--volt, #FFC107)' }}>{formatVnd(p.discountPrice!)}</b>
                              <div style={{ fontSize: '12px' }}>
                                <s className="muted">{formatVnd(p.price)}</s>{' '}
                                <span style={{ color: 'var(--c-red, #ef4444)', fontWeight: 600 }}>
                                  -{discountPercent}%
                                </span>
                              </div>
                            </div>
                          ) : (
                            <b>{formatVnd(p.price)}</b>
                          )}
                        </div>
                      </td>

                      <td data-label="Tồn kho">
                        <span
                          className={`pill ${
                            p.stockQuantity <= 0
                              ? 's-CANCELLED nodot'
                              : p.stockQuantity <= 5
                              ? 's-PENDING nodot'
                              : 'nodot'
                          }`}
                          style={{
                            backgroundColor:
                              p.stockQuantity <= 0
                                ? 'rgba(239, 68, 68, 0.15)'
                                : p.stockQuantity <= 5
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(255, 255, 255, 0.05)',
                            color:
                              p.stockQuantity <= 0
                                ? 'var(--c-red)'
                                : p.stockQuantity <= 5
                                ? 'var(--c-amber)'
                                : 'var(--ink)',
                          }}
                        >
                          {p.stockQuantity <= 0 ? 'Hết hàng' : p.stockQuantity}
                        </span>
                      </td>

                      <td data-label="Đã bán">
                        <span>{p.soldCountDisplay || p.soldCount.toLocaleString('vi-VN')}</span>
                      </td>

                      <td data-label="Hiển thị">
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={p.isAvailable}
                            onChange={(e) =>
                              toggleAvailabilityMutation.mutate({
                                id: p.id,
                                isAvailable: e.target.checked,
                              })
                            }
                            aria-label={`Hiển thị ${p.name}`}
                          />
                          <i></i>
                        </label>
                      </td>

                      <td className="td-act" style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            className="ibtn"
                            onClick={() => handleOpenEdit(p)}
                            aria-label={`Sửa ${p.name}`}
                            title="Sửa món"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            className="ibtn"
                            onClick={() => setDeletingProduct(p)}
                            aria-label={`Xóa ${p.name}`}
                            title="Xóa món"
                            style={{ color: 'var(--c-red, #ef4444)' }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty" style={{ padding: '48px 20px', textAlign: 'center' }}>
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '16px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          display: 'grid',
                          placeItems: 'center',
                          margin: '0 auto 14px',
                          color: 'var(--c-amber, #f59e0b)',
                        }}
                      >
                        <UtensilsCrossed size={28} />
                      </div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Không có món phù hợp</h3>
                      <p className="muted" style={{ fontSize: '13.5px' }}>
                        Thử đổi bộ lọc danh mục, tình trạng hoặc từ khóa tìm kiếm.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalElements > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              padding: '14px 20px',
              borderTop: '1px solid var(--line, rgba(255, 255, 255, 0.08))',
              backgroundColor: 'var(--surface-2, rgba(255, 255, 255, 0.02))',
            }}
          >
            {/* Trái: Thông tin hiển thị & Chọn kích thước trang */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span className="muted" style={{ fontSize: '13.5px' }}>
                Hiển thị{' '}
                <b style={{ color: 'var(--ink)' }}>
                  {(pagination.page - 1) * pagination.size + 1}
                </b>{' '}
                –{' '}
                <b style={{ color: 'var(--ink)' }}>
                  {Math.min(pagination.page * pagination.size, pagination.totalElements)}
                </b>{' '}
                trên tổng số <b style={{ color: 'var(--ink)' }}>{pagination.totalElements}</b> món
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="muted" style={{ fontSize: '13px' }}>Mỗi trang:</span>
                <select
                  className="select"
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(1);
                  }}
                  style={{
                    padding: '3px 8px',
                    fontSize: '13px',
                    width: 'auto',
                    minWidth: '70px',
                    height: '32px',
                  }}
                  aria-label="Số món mỗi trang"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Phải: Nút phân trang */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={pagination.page <= 1 || isProductsFetching}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  height: '34px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                aria-label="Trang trước"
              >
                <ChevronLeft size={16} />
                <span>Trước</span>
              </button>

              <div style={{ display: 'flex', gap: '4px' }}>
                {getPageNumbers(pagination.page, pagination.totalPages).map((pNum, idx) =>
                  pNum === '...' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      style={{
                        width: '34px',
                        height: '34px',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--muted)',
                        fontSize: '13px',
                      }}
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={`page-${pNum}`}
                      onClick={() => setPage(Number(pNum))}
                      disabled={isProductsFetching}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor:
                          pNum === pagination.page
                            ? 'var(--volt, #FFC107)'
                            : 'rgba(255, 255, 255, 0.1)',
                        backgroundColor:
                          pNum === pagination.page
                            ? 'var(--volt, #FFC107)'
                            : 'rgba(255, 255, 255, 0.04)',
                        color: pNum === pagination.page ? '#000' : 'var(--ink)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      aria-label={`Trang ${pNum}`}
                      aria-current={pNum === pagination.page ? 'page' : undefined}
                    >
                      {pNum}
                    </button>
                  )
                )}
              </div>

              <button
                className="btn btn-ghost"
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                disabled={pagination.page >= pagination.totalPages || isProductsFetching}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  height: '34px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                aria-label="Trang sau"
              >
                <span>Sau</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Drawer */}
      <ProductFormDrawer
        isOpen={isDrawerOpen}
        product={editingProduct}
        categories={categories}
        isSubmitting={saveProductMutation.isPending}
        onClose={() => setIsDrawerOpen(false)}
        onSave={(data) => saveProductMutation.mutate(data)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingProduct}
        title="Xóa món ăn?"
        description={`“${deletingProduct?.name}” sẽ bị xóa khỏi thực đơn cửa hàng. Các đơn hàng cũ đã đặt vẫn giữ nguyên lịch sử.`}
        confirmLabel="Xóa món"
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => {
          if (deletingProduct) {
            deleteProductMutation.mutate(deletingProduct.id);
          }
        }}
      />
    </div>
  );
};

