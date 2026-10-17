import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  LayoutGrid,
  Search,
} from 'lucide-react';
import { catalogApi } from '../api/catalogApi';
import { ProductTile } from '../components/ProductTile';
import { CategoryFormModal } from '../components/CategoryFormModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import type { Category } from '../types';

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Query categories (has productCount computed)
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: catalogApi.getCategories,
  });

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Mutations
  const saveCategoryMutation = useMutation({
    mutationFn: (data: Partial<Category>) => catalogApi.saveCategory(data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      showToast(editingCategory ? `Đã lưu danh mục “${saved.name}”` : `Đã thêm danh mục mới “${saved.name}”`);
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể lưu danh mục', true);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      catalogApi.toggleCategoryActive(id, isActive),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      showToast(vars.isActive ? 'Đã hiển thị danh mục trên thực đơn' : 'Đã ẩn danh mục khỏi thực đơn');
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      showToast(err?.message || 'Không thể cập nhật trạng thái danh mục', true);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => catalogApi.deleteCategory(id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
        showToast(res.message || 'Đã ngưng hoạt động danh mục thành công');
      } else {
        showToast(res.message || 'Không thể xóa danh mục này', true);
      }
    },
    onError: (err: any) => {
      showToast(err?.message || 'Lỗi khi xóa danh mục', true);
    },
  });

  const handleOpenNew = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (c: Category) => {
    if ((c.productCount || 0) > 0) {
      showToast(
        `Danh mục “${c.name}” còn ${c.productCount} món, hãy chuyển các món sang danh mục khác trước`,
        true
      );
      return;
    }
    setDeletingCategory(c);
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return categories.filter((c) => {
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && c.isActive) ||
        (statusFilter === 'inactive' && !c.isActive);

      return matchSearch && matchStatus;
    });
  }, [categories, searchQuery, statusFilter]);

  const activeCount = useMemo(() => categories.filter((c) => c.isActive).length, [categories]);
  const inactiveCount = useMemo(() => categories.filter((c) => !c.isActive).length, [categories]);

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
            backgroundColor: toastMessage.isError ? '#7f1d1d' : '#1E2238',
            color: '#fff',
            border: `1px solid ${toastMessage.isError ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
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
          {toastMessage.isError ? (
            <AlertCircle size={18} color="#ef4444" />
          ) : (
            <Check size={18} color="var(--volt, #FFC107)" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header (ahead) */}
      <div className="ah" style={{ marginBottom: '20px' }}>
        <div>
          <h2>Danh mục món ăn</h2>
          <p>{categories.length} danh mục trong hệ thống ({activeCount} đang hoạt động, {inactiveCount} ngưng hoạt động).</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleOpenNew}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Thêm danh mục
        </button>
      </div>

      {/* Toolbar: Search & Filter Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-muted, rgba(255, 255, 255, 0.4))',
            }}
          />
          <input
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc slug danh mục…"
            style={{ paddingLeft: '38px', height: '40px', fontSize: '13.5px' }}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'inline-flex', gap: '6px', background: 'var(--surface-2, rgba(255,255,255,0.04))', padding: '4px', borderRadius: '10px' }}>
          <button
            type="button"
            className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter('all')}
            style={{ padding: '6px 12px', fontSize: '13px', height: '32px' }}
          >
            Tất cả ({categories.length})
          </button>
          <button
            type="button"
            className={`btn ${statusFilter === 'active' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter('active')}
            style={{ padding: '6px 12px', fontSize: '13px', height: '32px' }}
          >
            Đang hiển thị ({activeCount})
          </button>
          <button
            type="button"
            className={`btn ${statusFilter === 'inactive' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter('inactive')}
            style={{ padding: '6px 12px', fontSize: '13px', height: '32px' }}
          >
            Ngưng hoạt động ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Categories Grid (ban-g) */}
      {isLoading ? (
        <div className="card card-p" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="muted">Đang tải danh mục…</p>
        </div>
      ) : filteredCategories.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredCategories.map((c) => (
            <article
              key={c.id}
              className="card"
              style={{
                borderRadius: '18px',
                overflow: 'hidden',
                backgroundColor: 'var(--surface-1, #1e2238)',
                border: `1px solid ${c.isActive ? 'var(--line, rgba(255, 255, 255, 0.08))' : 'rgba(239, 68, 68, 0.2)'}`,
                display: 'flex',
                flexDirection: 'column',
                opacity: c.isActive ? 1 : 0.82,
                transition: 'all 0.2s ease',
              }}
            >
              {/* Category Graphic Banner */}
              <div
                style={{
                  height: '110px',
                  backgroundColor: `${c.tint || '#FFB81C'}18`,
                  display: 'grid',
                  placeItems: 'center',
                  borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.06))',
                  position: 'relative',
                  filter: c.isActive ? 'none' : 'grayscale(35%)',
                }}
              >
                <ProductTile art={c.art} tint={c.tint} size="lg" />
                {!c.isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#f87171',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    Ngưng hoạt động
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                    {c.name}
                  </h3>
                  <label className="switch" title={c.isActive ? 'Đang bật hiển thị' : 'Đang tắt'}>
                    <input
                      type="checkbox"
                      checked={c.isActive}
                      disabled={toggleActiveMutation.isPending}
                      onChange={(e) =>
                        toggleActiveMutation.mutate({
                          id: c.id,
                          isActive: e.target.checked,
                        })
                      }
                      aria-label={`Hiển thị ${c.name}`}
                    />
                    <i></i>
                  </label>
                </div>

                {c.slug && (
                  <span
                    className="muted"
                    style={{
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      marginBottom: '6px',
                      display: 'block',
                      color: 'var(--volt, #FFB81C)',
                    }}
                  >
                    /{c.slug}
                  </span>
                )}

                <p
                  className="muted"
                  style={{
                    fontSize: '13.5px',
                    lineHeight: 1.45,
                    margin: '0 0 16px',
                    minHeight: '40px',
                    flex: 1,
                  }}
                >
                  {c.description || 'Chưa có mô tả cho danh mục này.'}
                </p>

                {/* Footer of Card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--line, rgba(255, 255, 255, 0.06))',
                  }}
                >
                  <span
                    className="tag"
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 600,
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      padding: '3px 10px',
                    }}
                  >
                    {c.productCount || 0} món
                  </span>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      className="ibtn"
                      onClick={() => handleOpenEdit(c)}
                      aria-label={`Sửa ${c.name}`}
                      title="Sửa danh mục"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="ibtn"
                      onClick={() => handleDeleteClick(c)}
                      aria-label={`Ngưng hoạt động ${c.name}`}
                      title="Ngưng hoạt động danh mục"
                      style={{ color: 'var(--c-red, #ef4444)' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty card card-p" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <LayoutGrid size={36} className="muted" style={{ margin: '0 auto 12px' }} />
          <h3>{searchQuery || statusFilter !== 'all' ? 'Không tìm thấy danh mục phù hợp' : 'Chưa có danh mục nào'}</h3>
          <p className="muted">
            {searchQuery || statusFilter !== 'all'
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái.'
              : 'Bấm "+ Thêm danh mục" để tạo danh mục thực đơn đầu tiên.'}
          </p>
        </div>
      )}

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        category={editingCategory}
        onClose={() => setIsModalOpen(false)}
        onSave={async (data) => {
          await saveCategoryMutation.mutateAsync(data);
        }}
        isSubmitting={saveCategoryMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingCategory}
        title="Ngưng hoạt động danh mục?"
        description={`Danh mục “${deletingCategory?.name}” sẽ chuyển sang ngưng hoạt động và không còn hiển thị trên thực đơn của khách hàng.`}
        confirmLabel="Ngưng hoạt động"
        onClose={() => setDeletingCategory(null)}
        onConfirm={() => {
          if (deletingCategory) {
            deleteCategoryMutation.mutate(deletingCategory.id);
          }
        }}
      />
    </div>
  );
};
