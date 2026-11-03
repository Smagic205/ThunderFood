import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Ticket, 
  Percent, 
  Truck, 
  Check, 
  AlertCircle, 
  Loader2, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { vouchersApi } from '../api/vouchersApi';
import { VoucherFormModal } from '../components/VoucherFormModal';
import { ConfirmDeleteVoucherModal } from '../components/ConfirmDeleteVoucherModal';
import type { VoucherAdmin, VoucherPayload, VoucherStatus } from '../types';

export const VouchersPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [page, setPage] = useState<number>(0);
  const [size] = useState<number>(10);

  // Modals & Toast
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherAdmin | null>(null);
  const [deletingVoucher, setDeletingVoucher] = useState<VoucherAdmin | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Query vouchers
  const { 
    data: vouchersData, 
    isLoading, 
    isFetching 
  } = useQuery({
    queryKey: ['admin-vouchers', { page, size, keyword: debouncedKeyword, selectedType, selectedStatus }],
    queryFn: () => vouchersApi.getVouchers({
      page,
      size,
      keyword: debouncedKeyword || undefined,
      voucherType: selectedType !== 'ALL' ? selectedType : undefined,
      status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      sortBy: 'id',
      direction: 'desc',
    }),
  });

  const vouchers = vouchersData?.content || [];
  const pagination = vouchersData?.pagination || {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: VoucherPayload) => vouchersApi.createVoucher(data),
    onSuccess: (newV) => {
      queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
      showToast(`Đã tạo voucher mới “${newV.code}” thành công!`);
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể tạo voucher', true);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: VoucherPayload }) => vouchersApi.updateVoucher(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
      showToast(`Đã cập nhật voucher “${updated.code}” thành công!`);
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể cập nhật voucher', true);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: number) => vouchersApi.toggleStatus(id),
    onSuccess: (v) => {
      queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
      showToast(`Đã ${v.isActive ? 'kích hoạt' : 'tạm ngưng'} mã “${v.code}”`);
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể đổi trạng thái', true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => vouchersApi.deleteVoucher(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
      showToast(res.message);
      setDeletingVoucher(null);
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể xóa voucher', true);
    },
  });

  const handleSaveVoucher = async (data: VoucherPayload) => {
    if (editingVoucher) {
      await updateMutation.mutateAsync({ id: editingVoucher.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingVoucher) return;
    await deleteMutation.mutateAsync(deletingVoucher.id);
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    let active = 0;
    let upcoming = 0;
    let expiredOrDepleted = 0;
    vouchers.forEach((v) => {
      if (v.status === 'ACTIVE') active++;
      else if (v.status === 'UPCOMING') upcoming++;
      else if (v.status === 'EXPIRED' || v.status === 'DEPLETED') expiredOrDepleted++;
    });
    return {
      total: pagination.totalElements,
      active,
      upcoming,
      expiredOrDepleted,
    };
  }, [vouchers, pagination.totalElements]);

  const renderStatusBadge = (status: VoucherStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="pill ok">Đang áp dụng</span>;
      case 'UPCOMING':
        return <span className="pill s-PENDING">Sắp diễn ra</span>;
      case 'EXPIRED':
        return <span className="pill s-CANCELLED">Đã hết hạn</span>;
      case 'DEPLETED':
        return <span className="pill bad">Hết số lượt</span>;
      case 'INACTIVE':
        return <span className="pill p-REFUNDED">Tạm ngưng</span>;
      default:
        return <span className="pill">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'grid', gap: '22px' }}>
      {/* Toast popup */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1100,
            padding: '12px 18px',
            borderRadius: '12px',
            backgroundColor: toastMessage.isError ? '#ef4444' : '#10b981',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toastMessage.isError ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="page-h">
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800 }}>Quản lý Khuyến mãi & Voucher</h1>
          <p className="muted" style={{ fontSize: '14px', marginTop: '4px' }}>
            Quản trị toàn diện các mã giảm giá món ăn, ưu đãi phí giao hàng và lượt sử dụng của khách hàng.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingVoucher(null);
            setIsFormOpen(true);
          }}
        >
          <Plus size={18} />
          <span>Tạo voucher mới</span>
        </button>
      </div>

      {/* KPI Stats cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="card card-p" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(255,184,28,0.15)', color: '#FFB81C', display: 'grid', placeItems: 'center' }}>
            <Ticket size={22} />
          </div>
          <div>
            <span className="muted" style={{ fontSize: '12.5px' }}>Tổng voucher hệ thống</span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--ink)' }}>{stats.total}</div>
          </div>
        </div>

        <div className="card card-p" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'grid', placeItems: 'center' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <span className="muted" style={{ fontSize: '12.5px' }}>Đang có hiệu lực</span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981' }}>{stats.active}</div>
          </div>
        </div>

        <div className="card card-p" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6', display: 'grid', placeItems: 'center' }}>
            <Calendar size={22} />
          </div>
          <div>
            <span className="muted" style={{ fontSize: '12.5px' }}>Sắp phát hành</span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#3b82f6' }}>{stats.upcoming}</div>
          </div>
        </div>

        <div className="card card-p" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', display: 'grid', placeItems: 'center' }}>
            <Layers size={22} />
          </div>
          <div>
            <span className="muted" style={{ fontSize: '12.5px' }}>Hết hạn / Hết lượt</span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ef4444' }}>{stats.expiredOrDepleted}</div>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="card card-p" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
          <Search size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }} />
          <input
            type="text"
            className="input"
            placeholder="Tìm theo mã hoặc tên voucher…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px', fontSize: '13.5px' }}
          />
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {/* Filter loại */}
          <select
            className="select"
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(0);
            }}
            style={{ height: '40px', fontSize: '13px', minWidth: '150px' }}
          >
            <option value="ALL">Tất cả loại voucher</option>
            <option value="PRODUCT">Món ăn (PRODUCT)</option>
            <option value="SHIPPING">Vận chuyển (SHIPPING)</option>
          </select>

          {/* Filter trạng thái */}
          <select
            className="select"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(0);
            }}
            style={{ height: '40px', fontSize: '13px', minWidth: '160px' }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang áp dụng</option>
            <option value="UPCOMING">Sắp diễn ra</option>
            <option value="EXPIRED">Đã hết hạn</option>
            <option value="DEPLETED">Đã hết lượt</option>
            <option value="INACTIVE">Tạm ngưng hoạt động</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', backgroundColor: 'var(--surface-2, rgba(255,255,255,0.03))' }}>
                <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--ink-2)' }}>Mã & Tên Voucher</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--ink-2)' }}>Loại</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--ink-2)' }}>Mức giảm</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--ink-2)' }}>Đơn tối thiểu</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--ink-2)' }}>Đã dùng / Giới hạn</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--ink-2)' }}>Thời hạn</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--ink-2)' }}>Trạng thái</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--ink-2)', textAlign: 'center' }}>Bật/Tắt</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--ink-2)', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--volt)' }} />
                    <p className="muted">Đang tải danh sách voucher…</p>
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <Ticket size={36} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                    <p style={{ fontWeight: 600, color: 'var(--ink)' }}>Không tìm thấy voucher nào</p>
                    <p className="muted" style={{ fontSize: '12.5px', marginTop: '4px' }}>
                      Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc trạng thái.
                    </p>
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => {
                  const isShipping = v.voucherType === 'SHIPPING';
                  const isPercent = v.discountType === 'PERCENT';
                  const discountDisplay = isPercent
                    ? `Giảm ${v.discountValue}%`
                    : `Giảm ${Number(v.discountValue).toLocaleString('vi-VN')}đ`;

                  return (
                    <tr
                      key={v.id}
                      style={{
                        borderBottom: '1px solid var(--line)',
                        transition: 'background 0.15s',
                      }}
                      className="table-row-hover"
                    >
                      {/* Mã & Tên */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: '14px',
                              letterSpacing: '0.04em',
                              color: 'var(--ink)',
                            }}
                          >
                            {v.code}
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--ink-2)', marginTop: '2px' }}>
                          {v.name}
                        </div>
                      </td>

                      {/* Loại */}
                      <td style={{ padding: '14px 18px' }}>
                        {isShipping ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(16,185,129,0.12)',
                              color: '#10b981',
                            }}
                          >
                            <Truck size={13} />
                            Freeship
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(255,184,28,0.15)',
                              color: '#d97706',
                            }}
                          >
                            <Percent size={13} />
                            Món ăn
                          </span>
                        )}
                      </td>

                      {/* Mức giảm */}
                      <td style={{ padding: '14px 18px' }}>
                        <b style={{ color: 'var(--ink)', fontSize: '14px' }}>{discountDisplay}</b>
                        {isPercent && v.maxDiscountAmount && (
                          <div style={{ fontSize: '11.5px', color: 'var(--ink-3)', marginTop: '2px' }}>
                            Tối đa: {Number(v.maxDiscountAmount).toLocaleString('vi-VN')}đ
                          </div>
                        )}
                      </td>

                      {/* Đơn tối thiểu */}
                      <td style={{ padding: '14px 18px', color: 'var(--ink-2)' }}>
                        {v.minOrderAmount && v.minOrderAmount > 0 ? (
                          `${Number(v.minOrderAmount).toLocaleString('vi-VN')}đ`
                        ) : (
                          <span style={{ color: 'var(--ink-3)' }}>0đ (Mọi đơn)</span>
                        )}
                      </td>

                      {/* Lượt dùng */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{v.usedCount || 0}</span>
                        <span style={{ color: 'var(--ink-3)' }}> / {v.usageLimit ? v.usageLimit : '∞'}</span>
                        <div style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '2px' }}>
                          Tối đa {v.usageLimitPerUser || 1} lần/khách
                        </div>
                      </td>

                      {/* Thời hạn */}
                      <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--ink-2)' }}>
                        <div>{new Date(v.startDate).toLocaleDateString('vi-VN')}</div>
                        <div style={{ color: 'var(--ink-3)' }}>đến {new Date(v.endDate).toLocaleDateString('vi-VN')}</div>
                      </td>

                      {/* Trạng thái */}
                      <td style={{ padding: '14px 18px' }}>
                        {renderStatusBadge(v.status)}
                      </td>

                      {/* Bật/Tắt Switch */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={v.isActive}
                            onChange={() => toggleStatusMutation.mutate(v.id)}
                            disabled={toggleStatusMutation.isPending}
                          />
                          <i />
                        </label>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="ibtn"
                            title="Chỉnh sửa voucher"
                            onClick={() => {
                              setEditingVoucher(v);
                              setIsFormOpen(true);
                            }}
                            style={{ width: '34px', height: '34px' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="ibtn"
                            title="Xóa / vô hiệu hóa voucher"
                            onClick={() => setDeletingVoucher(v)}
                            style={{ width: '34px', height: '34px', color: '#ef4444' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              padding: '14px 18px',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
            }}
          >
            <span className="muted">
              Hiển thị {vouchers.length} trên tổng số {pagination.totalElements} voucher
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                disabled={!pagination.hasPrevious || isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Trang trước
              </button>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                Trang {pagination.page + 1} / {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                disabled={!pagination.hasNext || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <VoucherFormModal
        isOpen={isFormOpen}
        voucher={editingVoucher}
        onClose={() => {
          setIsFormOpen(false);
          setEditingVoucher(null);
        }}
        onSave={handleSaveVoucher}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Modal Confirm Delete */}
      <ConfirmDeleteVoucherModal
        isOpen={!!deletingVoucher}
        voucher={deletingVoucher}
        onClose={() => setDeletingVoucher(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
