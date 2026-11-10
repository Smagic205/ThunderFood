import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Shield,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
} from 'lucide-react';
import { staffsApi } from '../api/staffsApi';
import { CreateStaffModal } from '../components/CreateStaffModal';
import type { StaffAccount, CreateStaffPayload } from '../types';

export const StaffsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal & Toast
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all staff accounts
  const {
    data: staffs = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<StaffAccount[]>({
    queryKey: ['admin-staffs'],
    queryFn: staffsApi.getAllStaffs,
    staleTime: 15 * 1000,
  });

  // Mutation: Create staff
  const createMutation = useMutation({
    mutationFn: (payload: CreateStaffPayload) => staffsApi.createStaff(payload),
    onSuccess: (newStaff) => {
      queryClient.invalidateQueries({ queryKey: ['admin-staffs'] });
      setIsModalOpen(false);
      showToast(`Đã tạo tài khoản nhân viên “${newStaff.fullName}” (${newStaff.email}) thành công!`);
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể tạo tài khoản nhân viên', 'error');
    },
  });

  // Filtered list
  const filteredStaffs = useMemo(() => {
    return staffs.filter((s) => {
      // Status filter
      if (statusFilter !== 'ALL' && s.status !== statusFilter) {
        return false;
      }
      // Keyword filter
      if (!keyword.trim()) return true;
      const q = keyword.trim().toLowerCase();
      const phoneNoSpace = (s.phone || '').replace(/\s+/g, '');
      const qNoSpace = q.replace(/\s+/g, '');

      return (
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        phoneNoSpace.includes(qNoSpace)
      );
    });
  }, [staffs, keyword, statusFilter]);

  const activeCount = useMemo(() => staffs.filter((s) => s.status === 'ACTIVE').length, [staffs]);

  const getInitials = (name?: string) => {
    if (!name) return 'NV';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div
          className="card card-p"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: toast.type === 'success' ? '#F6FFED' : '#FFF1F0',
            border: `1px solid ${toast.type === 'success' ? '#B7EB8F' : '#FFCCC7'}`,
            color: toast.type === 'success' ? '#389E0D' : '#CF1322',
            boxShadow: 'var(--sh-2)',
            padding: '12px 18px',
            borderRadius: '10px',
            maxWidth: '450px',
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 6px' }}>
            Quản lý nhân viên
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: '14px' }}>
            Tạo tài khoản và quản lý đội ngũ nhân viên điều phối, giao hàng ThunderFood.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Thêm nhân viên mới
        </button>
      </div>

      {/* KPI mini-cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div className="card card-p" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'var(--volt-soft)',
              color: 'var(--volt-press)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <span className="muted" style={{ fontSize: '13px' }}>Tổng số nhân viên</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{staffs.length}</div>
          </div>
        </div>

        <div className="card card-p" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#E6F7FF',
              color: 'var(--c-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserCheck size={22} />
          </div>
          <div>
            <span className="muted" style={{ fontSize: '13px' }}>Đang hoạt động</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{activeCount}</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card panel-t">
        {/* Filter bar */}
        <div
          className="filters-bar"
          style={{
            padding: '16px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div className="input-ic" style={{ flex: '1', minWidth: '260px' }}>
            <div className="ic-prefix"><Search size={18} /></div>
            <input
              className="input"
              type="search"
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <select
            className="input"
            style={{ width: 'auto', minWidth: '170px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Tạm khóa / Ẩn</option>
          </select>

          <span className="muted" style={{ fontSize: '13px', marginLeft: 'auto' }}>
            {filteredStaffs.length} nhân viên
          </span>
        </div>

        {/* Table */}
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '60px',
                        gap: '10px',
                      }}
                    >
                      <Loader2 size={24} className="animate-spin text-muted" />
                      <span className="muted">Đang tải danh sách nhân viên...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty" style={{ padding: '40px' }}>
                      <AlertCircle size={32} style={{ color: 'var(--c-red)', marginBottom: '8px' }} />
                      <h3>Lỗi khi tải dữ liệu</h3>
                      <p className="muted">{(error as any)?.message || 'Không thể kết nối đến máy chủ.'}</p>
                      <button
                        className="btn btn-soft btn-sm"
                        style={{ marginTop: '12px' }}
                        onClick={() => refetch()}
                      >
                        Thử lại
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredStaffs.length > 0 ? (
                filteredStaffs.map((staff) => (
                  <tr key={staff.id}>
                    {/* Nhân viên */}
                    <td className="td-main">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {staff.avatarUrl ? (
                          <img
                            src={staff.avatarUrl}
                            alt={staff.fullName}
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: 'var(--volt-soft)',
                              color: 'var(--on-volt)',
                              fontWeight: 700,
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(staff.fullName)}
                          </div>
                        )}
                        <div>
                          <b style={{ fontSize: '14.5px' }}>{staff.fullName}</b>
                          <small className="muted" style={{ display: 'block', fontSize: '12px' }}>
                            ID: #{staff.id}
                          </small>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td data-label="Email">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={14} className="text-muted" />
                        <span>{staff.email}</span>
                      </div>
                    </td>

                    {/* SĐT */}
                    <td data-label="Số điện thoại">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} className="text-muted" />
                        <a className="tlink" href={`tel:${staff.phone}`}>
                          {staff.phone || '—'}
                        </a>
                      </div>
                    </td>

                    {/* Vai trò */}
                    <td data-label="Vai trò">
                      <span
                        style={{
                          background: '#E6F7FF',
                          color: 'var(--c-blue)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Shield size={12} /> {staff.role || 'STAFF'}
                      </span>
                    </td>

                    {/* Trạng thái */}
                    <td data-label="Trạng thái">
                      <span
                        style={{
                          background: staff.status === 'ACTIVE' ? '#F6FFED' : '#FFF1F0',
                          color: staff.status === 'ACTIVE' ? '#389E0D' : '#CF1322',
                          border: `1px solid ${staff.status === 'ACTIVE' ? '#B7EB8F' : '#FFCCC7'}`,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {staff.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>

                    {/* Ngày tạo */}
                    <td data-label="Ngày tạo">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} className="text-muted" />
                        <small className="muted">
                          {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </small>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="empty" style={{ padding: '40px' }}>
                      <h3>Không tìm thấy nhân viên</h3>
                      <p className="muted">
                        {keyword.trim()
                          ? `Không có nhân viên nào phù hợp với từ khóa “${keyword}”.`
                          : 'Hệ thống chưa có nhân viên nào được tạo.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal tạo nhân viên */}
      <CreateStaffModal
        isOpen={isModalOpen}
        isSubmitting={createMutation.isPending}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
    </>
  );
};
