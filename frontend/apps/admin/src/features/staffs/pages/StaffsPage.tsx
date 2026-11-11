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
  Lock,
  Unlock,
  Check,
  Zap,
  Truck,
  X,
} from 'lucide-react';
import { staffsApi } from '../api/staffsApi';
import { CreateStaffModal } from '../components/CreateStaffModal';
import type { StaffAccount, CreateStaffPayload } from '../types';

export const StaffsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals & Action Target
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<StaffAccount | null>(null);
  const [roleTarget, setRoleTarget] = useState<StaffAccount | null>(null);
  const [selectedRole, setSelectedRole] = useState<'STAFF' | 'ADMIN'>('STAFF');

  // Toast
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

  // Mutation: Toggle staff status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'LOCKED' }) =>
      staffsApi.updateStaffStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-staffs'] });
      showToast(
        `Đã ${variables.status === 'LOCKED' ? 'tạm khóa' : 'kích hoạt lại'} tài khoản nhân viên thành công!`
      );
      setStatusTarget(null);
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể cập nhật trạng thái nhân viên', 'error');
    },
  });

  // Mutation: Update staff role
  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: 'STAFF' | 'ADMIN' }) =>
      staffsApi.updateStaffRole(id, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-staffs'] });
      showToast(`Đã phân quyền vai trò nhân sự thành ${variables.role} thành công!`);
      setRoleTarget(null);
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể cập nhật vai trò nhân viên', 'error');
    },
  });

  // Filtered list
  const filteredStaffs = useMemo(() => {
    return staffs.filter((s) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        const isTargetActive = statusFilter === 'ACTIVE';
        const isCurrentActive = s.status === 'ACTIVE';
        if (isTargetActive !== isCurrentActive) {
          return false;
        }
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

  const handleOpenStatusModal = (staff: StaffAccount) => {
    setStatusTarget(staff);
  };

  const handleConfirmStatus = () => {
    if (!statusTarget) return;
    const nextStatus = statusTarget.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    statusMutation.mutate({ id: statusTarget.id, status: nextStatus });
  };

  const handleOpenRoleModal = (staff: StaffAccount) => {
    setRoleTarget(staff);
    setSelectedRole(staff.role === 'ADMIN' ? 'ADMIN' : 'STAFF');
  };

  const handleConfirmRole = () => {
    if (!roleTarget) return;
    roleMutation.mutate({ id: roleTarget.id, role: selectedRole });
  };

  return (
    <>
      {/* Toast Notification */}
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
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <div style={{ fontSize: '14px', lineHeight: 1.4 }}>{toast.message}</div>
        </div>
      )}

      {/* Page Header */}
      <div className="ah" style={{ marginBottom: '20px' }}>
        <div>
          <h2>Quản lý nhân viên</h2>
          <p>
            Quản lý tài khoản nhân viên vận hành, shipper, phân quyền và trạng thái làm việc
          </p>
        </div>
        <div className="row wrap" style={{ gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} />
            <span>Thêm nhân viên</span>
          </button>
        </div>
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
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--c-blue, #60a5fa)',
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
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserCheck size={22} />
          </div>
          <div>
            <span className="muted" style={{ fontSize: '13px' }}>Đang làm việc</span>
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
            style={{ width: 'auto', minWidth: '170px', backgroundColor: '#1e2238', color: '#fff' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL" style={{ backgroundColor: '#1e2238', color: '#fff' }}>Tất cả trạng thái</option>
            <option value="ACTIVE" style={{ backgroundColor: '#1e2238', color: '#fff' }}>Đang hoạt động</option>
            <option value="INACTIVE" style={{ backgroundColor: '#1e2238', color: '#fff' }}>Tạm khóa / Nghỉ việc</option>
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
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7}>
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
                  <td colSpan={7}>
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
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: 'var(--c-blue, #60a5fa)',
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
                          <b style={{ fontSize: '14.5px', color: '#fff' }}>{staff.fullName}</b>
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
                          background: staff.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: staff.role === 'ADMIN' ? '#f87171' : '#60a5fa',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {staff.role === 'ADMIN' ? <Zap size={12} /> : <Shield size={12} />}
                        {staff.role || 'STAFF'}
                      </span>
                    </td>

                    {/* Trạng thái */}
                    <td data-label="Trạng thái">
                      <span
                        style={{
                          background: staff.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: staff.status === 'ACTIVE' ? '#34d399' : '#f87171',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {staff.status === 'ACTIVE' ? <UserCheck size={12} /> : <Lock size={12} />}
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

                    {/* Thao tác / Chức năng */}
                    <td data-label="Thao tác" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {/* Nút Phân quyền vai trò nội bộ */}
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleOpenRoleModal(staff)}
                          title="Phân quyền nội bộ (STAFF / ADMIN)"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                        >
                          <Shield size={13} />
                          <span style={{ marginLeft: '4px' }}>Vai trò</span>
                        </button>

                        {/* Nút Khóa / Mở khóa nhân viên */}
                        <button
                          type="button"
                          className={staff.status === 'ACTIVE' ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
                          onClick={() => handleOpenStatusModal(staff)}
                          title={staff.status === 'ACTIVE' ? 'Tạm khóa nhân viên' : 'Kích hoạt lại'}
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            color: staff.status === 'ACTIVE' ? '#f87171' : '#fff',
                            borderColor: staff.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.3)' : undefined,
                          }}
                        >
                          {staff.status === 'ACTIVE' ? <Lock size={13} /> : <Unlock size={13} />}
                          <span style={{ marginLeft: '4px' }}>
                            {staff.status === 'ACTIVE' ? 'Khóa' : 'Mở'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
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

      {/* Modal xác nhận Khóa / Mở khóa nhân viên */}
      {statusTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 11, 38, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setStatusTarget(null)}
        >
          <div
            className="card card-p"
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'var(--surface-1, #1e2238)',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
              borderRadius: '16px',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: statusTarget.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: statusTarget.status === 'ACTIVE' ? '#f87171' : '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {statusTarget.status === 'ACTIVE' ? <Lock size={20} /> : <Unlock size={20} />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                  {statusTarget.status === 'ACTIVE' ? 'Tạm khóa nhân viên' : 'Kích hoạt lại nhân viên'}
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--muted, #94a3b8)' }}>
                  {statusTarget.fullName} ({statusTarget.email})
                </span>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              {statusTarget.status === 'ACTIVE'
                ? 'Khi bị tạm khóa, nhân viên này sẽ không thể đăng nhập vào ứng dụng Staff và không được nhận gói giao hàng mới.'
                : 'Kích hoạt lại sẽ cho phép nhân viên tiếp tục đăng nhập và nhận xử lý đơn hàng bình thường.'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setStatusTarget(null)}
                disabled={statusMutation.isPending}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={statusTarget.status === 'ACTIVE' ? 'btn btn-ghost' : 'btn btn-primary'}
                style={{
                  backgroundColor: statusTarget.status === 'ACTIVE' ? '#dc2626' : undefined,
                  color: '#fff',
                }}
                onClick={handleConfirmStatus}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? (
                  <Loader2 className="spin" size={16} />
                ) : statusTarget.status === 'ACTIVE' ? (
                  'Xác nhận tạm khóa'
                ) : (
                  'Xác nhận kích hoạt'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Phân quyền vai trò nội bộ (STAFF <-> ADMIN) */}
      {roleTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 11, 38, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setRoleTarget(null)}
        >
          <div
            className="card card-p"
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--surface-1, #1e2238)',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: 'var(--c-blue, #60a5fa)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Shield size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                    Phân quyền vai trò nội bộ
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--muted, #94a3b8)' }}>
                    Điều chỉnh thẩm quyền nhân sự trong doanh nghiệp
                  </span>
                </div>
              </div>
              <button className="ibtn" onClick={() => setRoleTarget(null)} style={{ color: 'var(--muted, #94a3b8)' }}>
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              <span style={{ color: 'var(--muted, #94a3b8)' }}>Nhân viên: </span>
              <b style={{ color: '#fff' }}>{roleTarget.fullName}</b> ({roleTarget.email})
            </div>

            {/* Selection Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              {/* STAFF option */}
              <div
                onClick={() => setSelectedRole('STAFF')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: selectedRole === 'STAFF' ? '2px solid #3b82f6' : '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                  backgroundColor: selectedRole === 'STAFF' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Truck size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Nhân viên vận hành (STAFF)</span>
                    {selectedRole === 'STAFF' && <Check size={16} color="#3b82f6" />}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted, #94a3b8)', marginTop: '2px' }}>
                    Quyền duyệt đơn hàng, nhận gói và thực hiện giao hàng cho khách.
                  </div>
                </div>
              </div>

              {/* ADMIN option */}
              <div
                onClick={() => setSelectedRole('ADMIN')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: selectedRole === 'ADMIN' ? '2px solid #ef4444' : '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                  backgroundColor: selectedRole === 'ADMIN' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Zap size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Quản trị viên (ADMIN)</span>
                    {selectedRole === 'ADMIN' && <Check size={16} color="#ef4444" />}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted, #94a3b8)', marginTop: '2px' }}>
                    Thăng cấp lên quản trị: Toàn quyền cấu hình, tài chính và quản lý nhân sự.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRoleTarget(null)}
                disabled={roleMutation.isPending}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmRole}
                disabled={roleMutation.isPending}
              >
                {roleMutation.isPending ? <Loader2 className="spin" size={16} /> : 'Lưu vai trò'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
