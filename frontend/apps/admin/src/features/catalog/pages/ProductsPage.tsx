import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  UtensilsCrossed,
} from 'lucide-react';
import { catalogApi } from '../api/catalogApi';
import { ProductTile } from '../components/ProductTile';
import { ProductFormDrawer } from '../components/ProductFormDrawer';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import type { Product, Category, ProductStockFilter } from '../types';

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number>(0);
  const [stockFilter, setStockFilter] = useState<ProductStockFilter>('all');

  // Modal / Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Queries
  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: catalogApi.getProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: catalogApi.getCategories,
  });

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
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => catalogApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      showToast('Đã xóa món ăn khỏi thực đơn');
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: number; isAvailable: boolean }) =>
      catalogApi.toggleProductAvailability(id, isAvailable),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      showToast(vars.isAvailable ? 'Đã hiển thị món trên cửa hàng' : 'Đã ẩn món khỏi thực đơn');
    },
  });

  // Category map
  const categoryMap = useMemo(() => {
    return new Map<number, Category>(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Low stock count (<= 5)
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stockQuantity <= 5).length;
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchName = !q || p.name.toLowerCase().includes(q);
      const matchCat = selectedCatId === 0 || p.categoryId === selectedCatId;
      let matchStock = true;
      if (stockFilter === 'in') {
        matchStock = p.isAvailable && p.stockQuantity > 0;
      } else if (stockFilter === 'out') {
        matchStock = p.isAvailable && p.stockQuantity <= 0;
      } else if (stockFilter === 'hidden') {
        matchStock = !p.isAvailable;
      }
      return matchName && matchCat && matchStock;
    });
  }, [products, searchQuery, selectedCatId, stockFilter]);

  const formatVnd = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  const handleOpenNew = () => {
    setEditingProduct(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
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
          <h2>Quản lý món ăn</h2>
          <p>
            {products.length} món, {lowStockCount} món sắp hết hoặc đã hết hàng.
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
          <div className="input-ic" style={{ flex: '1 1 240px', maxWidth: '380px' }}>
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

          <select
            className="select"
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(Number(e.target.value))}
            style={{ width: 'auto', minWidth: '160px' }}
            aria-label="Danh mục"
          >
            <option value={0}>Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as ProductStockFilter)}
            style={{ width: 'auto', minWidth: '160px' }}
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
                    <div className="empty" style={{ padding: '40px' }}>
                      <p className="muted">Đang tải danh sách món ăn…</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const cat = categoryMap.get(p.categoryId);
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
                            imageUrl={p.imgs?.[0] || null}
                            name={p.name}
                            size="xs"
                          />
                          <div style={{ minWidth: 0 }}>
                            <b style={{ color: 'var(--ink)', display: 'block' }}>{p.name}</b>
                            <small className="muted">
                              #{p.id} · {p.slug.slice(0, 24)}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td data-label="Danh mục">
                        <span style={{ color: 'var(--ink)' }}>{cat?.name || 'Chưa phân loại'}</span>
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
                        <span>{p.soldCount.toLocaleString('vi-VN')}</span>
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
      </div>

      {/* Form Drawer */}
      <ProductFormDrawer
        isOpen={isDrawerOpen}
        product={editingProduct}
        categories={categories}
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
