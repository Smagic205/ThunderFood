import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { bannersApi } from '../api/bannersApi';
import { BannerFormModal } from '../components/BannerFormModal';
import { ConfirmDeleteBannerModal } from '../components/ConfirmDeleteBannerModal';
import type { BannerItem, CreateBannerPayload, UpdateBannerPayload } from '../types';

export const BannersPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<BannerItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BannerItem | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Query: Get all banners
  const { data: banners = [], isLoading, isError, refetch } = useQuery<BannerItem[]>({
    queryKey: ['admin-banners'],
    queryFn: bannersApi.getAllBanners,
    staleTime: 15 * 1000,
  });

  // Mutation: Create
  const createMutation = useMutation({
    mutationFn: (payload: CreateBannerPayload) => bannersApi.createBanner(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setIsFormOpen(false);
      showToast('Đã thêm banner quảng cáo mới thành công!');
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể tạo banner', 'error');
    },
  });

  // Mutation: Update
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateBannerPayload }) =>
      bannersApi.updateBanner(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setIsFormOpen(false);
      showToast('Cập nhật banner thành công!');
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể cập nhật banner', 'error');
    },
  });

  // Mutation: Toggle Active
  const toggleMutation = useMutation({
    mutationFn: (id: number) => bannersApi.toggleActive(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      showToast(`Đã ${updated.isActive ? 'bật' : 'tắt'} hiển thị banner thành công!`);
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể đổi trạng thái banner', 'error');
    },
  });

  // Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: (id: number) => bannersApi.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setDeleteTarget(null);
      showToast('Đã xóa banner thành công!');
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể xóa banner', 'error');
    },
  });

  const handleOpenCreate = () => {
    setSelectedBanner(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (banner: BannerItem) => {
    setSelectedBanner(banner);
    setIsFormOpen(true);
  };

  const handleSave = async (payload: CreateBannerPayload | UpdateBannerPayload) => {
    if (selectedBanner) {
      await updateMutation.mutateAsync({ id: selectedBanner.id, payload });
    } else {
      await createMutation.mutateAsync(payload as CreateBannerPayload);
    }
  };

  const activeCount = banners.filter((b) => b.isActive).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Alert */}
      {toast && (
        <div
          className="card card-p"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#064e3b' : '#7f1d1d',
            border: `1px solid ${toast.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: '#fff',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            maxWidth: '400px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <div style={{ fontSize: '14px', lineHeight: 1.4 }}>{toast.message}</div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink, #fff)', margin: 0 }}>
            Quản lý Banner quảng cáo
          </h2>
          <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
            Quản lý hình ảnh khuyến mãi, sự kiện hiển thị trên ứng dụng web và mobile
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            className="badge"
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            {activeCount}/{banners.length} đang hiển thị
          </span>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Thêm Banner mới</span>
          </button>
        </div>
      </div>

      {/* Banners List / Grid */}
      {isLoading ? (
        <div className="card card-p" style={{ padding: '60px', textAlign: 'center', color: 'var(--muted, #94a3b8)' }}>
          <Loader2 className="spin" size={32} style={{ margin: '0 auto 12px' }} />
          <div>Đang tải danh sách banner...</div>
        </div>
      ) : isError ? (
        <div className="card card-p" style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
          <AlertTriangle size={32} style={{ margin: '0 auto 12px' }} />
          <div>Không thể tải danh sách banner. Vui lòng thử lại.</div>
          <button className="btn btn-primary btn-sm" onClick={() => refetch()} style={{ marginTop: '12px' }}>
            Thử lại
          </button>
        </div>
      ) : banners.length === 0 ? (
        <div className="card card-p" style={{ padding: '60px', textAlign: 'center', color: 'var(--muted, #94a3b8)' }}>
          <ImageIcon size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>Chưa có banner nào</div>
          <p style={{ margin: '6px 0 16px 0', fontSize: '14px' }}>Tạo banner đầu tiên để hiển thị cho khách hàng</p>
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            <Plus size={16} /> Thêm banner
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px',
          }}
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="card"
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                backgroundColor: 'var(--surface-1, #1e2238)',
                opacity: banner.isActive ? 1 : 0.7,
                transition: 'all 0.2s ease',
              }}
            >
              {/* Banner Image */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '170px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={banner.imageUrl}
                  alt={`Banner ${banner.id}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Status Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: banner.isActive ? 'rgba(16, 185, 129, 0.85)' : 'rgba(100, 116, 139, 0.85)',
                    color: '#fff',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {banner.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>{banner.isActive ? 'Hiển thị' : 'Đang ẩn'}</span>
                </div>

                {/* Sort Order Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: '#f8fafc',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  Thứ tự: {banner.sortOrder}
                </div>
              </div>

              {/* Banner Info */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted, #94a3b8)' }}>
                  <ExternalLink size={14} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {banner.linkUrl ? banner.linkUrl : 'Không có liên kết'}
                  </span>
                </div>

                {/* Bottom Actions */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-dark btn-sm"
                    onClick={() => toggleMutation.mutate(banner.id)}
                    title={banner.isActive ? 'Tắt hiển thị' : 'Bật hiển thị'}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    {banner.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    <span style={{ marginLeft: '4px' }}>{banner.isActive ? 'Ẩn' : 'Hiện'}</span>
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleOpenEdit(banner)}
                      title="Chỉnh sửa"
                      style={{ padding: '6px 10px' }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setDeleteTarget(banner)}
                      title="Xóa banner"
                      style={{ padding: '6px 10px', color: '#f87171' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      <BannerFormModal
        isOpen={isFormOpen}
        banner={selectedBanner}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteBannerModal
        isOpen={!!deleteTarget}
        banner={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
