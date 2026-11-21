import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  UserCheck,
  Lock,
  Unlock,
  Loader2,
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import { customersApi } from '../api/customersApi';
import type { UserAdminItem, UserStatus } from '../types';

export const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  // Status Lock/Unlock Modal & Toast
  const [selectedUser, setSelectedUser] = useState<UserAdminItem | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch users list
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users', { keyword, role: roleFilter, status: statusFilter, page }],
    queryFn: () =>
      customersApi.getAllUsers({
        keyword,
        role: roleFilter,
        status: statusFilter,
        page,
        size: 10,
      }),
    staleTime: 10 * 1000,
  });

  const users = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 1;

  // Mutation: Toggle status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: UserStatus }) =>
      customersApi.updateUserStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast(
        `Đã ${updated.status === 'LOCKED' ? 'khóa' : 'mở khóa'} tài khoản ${updated.fullName || updated.email} thành công!`
      );
      setSelectedUser(null);
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể cập nhật trạng thái người dùng', 'error');
    },
  });

  const closeModal = () => {
    setSelectedUser(null);
  };

  const handleConfirmStatus = () => {
    if (!selectedUser) return;
    const nextStatus: UserStatus = selectedUser.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    statusMutation.mutate({ id: selectedUser.id, status: nextStatus });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '--';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

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
          {toast.type === 'success' ? <UserCheck size={20} /> : <AlertTriangle size={20} />}
          <div style={{ fontSize: '14px', lineHeight: 1.4 }}>{toast.message}</div>
        </div>
      )}

      {/* Header & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink, #fff)', margin: 0 }}>
            Quản lý khách hàng & tài khoản
          </h2>
          <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
            Xem thông tin người dùng, lịch sử tài khoản và khóa tài khoản khi có vi phạm
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            className="badge"
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--c-blue, #60a5fa)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            Tổng: {totalElements} tài khoản
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card card-p" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted, #94a3b8)',
              }}
            />
            <input
              type="text"
              placeholder="Tìm theo họ tên, email, SĐT..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                color: '#fff',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted, #94a3b8)' }}>Vai trò:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#1e2238',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                color: '#fff',
                fontSize: '13px',
              }}
            >
              <option value="ALL" style={{ backgroundColor: '#1e2238', color: '#fff' }}>Tất cả vai trò</option>
              <option value="CUSTOMER" style={{ backgroundColor: '#1e2238', color: '#fff' }}>Khách hàng (CUSTOMER)</option>
              <option value="STAFF" style={{ backgroundColor: '#1e2238', color: '#fff' }}>Nhân viên (STAFF)</option>
              <option value="ADMIN" style={{ backgroundColor: '#1e2238', color: '#fff' }}>Quản trị viên (ADMIN)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted, #94a3b8)' }}>Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#1e2238',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                color: '#fff',
                fontSize: '13px',
              }}
            >
              <option value="ALL" style={{ backgroundColor: '#1e2238', color: '#fff' }}>Tất cả trạng thái</option>
              <option value="ACTIVE" style={{ backgroundColor: '#1e2238', color: '#fff' }}>Đang hoạt động</option>
              <option value="LOCKED" style={{ backgroundColor: '#1e2238', color: '#fff' }}>Đã bị khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted, #94a3b8)' }}>
            <Loader2 className="spin" size={32} style={{ margin: '0 auto 12px' }} />
            <div>Đang tải danh sách người dùng...</div>
          </div>
        ) : isError ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 12px' }} />
            <div>Có lỗi xảy ra khi tải dữ liệu người dùng.</div>
            <button className="btn btn-primary btn-sm" onClick={() => refetch()} style={{ marginTop: '12px' }}>
              Thử lại
            </button>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted, #94a3b8)' }}>
            <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <div style={{ fontSize: '15px', fontWeight: 500 }}>Không tìm thấy người dùng nào</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.1))', color: 'var(--muted, #94a3b8)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <th style={{ padding: '14px 20px' }}>Người dùng</th>
                  <th style={{ padding: '14px 16px' }}>Liên hệ</th>
                  <th style={{ padding: '14px 16px' }}>Vai trò</th>
                  <th style={{ padding: '14px 16px' }}>Trạng thái</th>
                  <th style={{ padding: '14px 16px' }}>Ngày tạo</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.06))',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* User info & Avatar */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(59, 130, 246, 0.2)',
                              color: 'var(--c-blue, #60a5fa)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '14px',
                            }}
                          >
                            {getInitials(user.fullName)}
                          </span>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{user.fullName || 'Chưa đặt tên'}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted, #94a3b8)' }}>ID: #{user.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0' }}>
                          <Mail size={13} style={{ color: 'var(--muted, #94a3b8)' }} />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted, #94a3b8)' }}>
                            <Phone size={13} />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor:
                            user.role === 'ADMIN'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : user.role === 'STAFF'
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                          color:
                            user.role === 'ADMIN'
                              ? '#f87171'
                              : user.role === 'STAFF'
                              ? '#60a5fa'
                              : '#34d399',
                        }}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor:
                            user.status === 'ACTIVE'
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(239, 68, 68, 0.12)',
                          color: user.status === 'ACTIVE' ? '#34d399' : '#f87171',
                        }}
                      >
                        {user.status === 'ACTIVE' ? <UserCheck size={13} /> : <Lock size={13} />}
                        {user.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td style={{ padding: '14px 16px', color: 'var(--muted, #94a3b8)', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>

                    {/* Actions: Only Lock / Unlock */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        type="button"
                        className={user.status === 'ACTIVE' ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
                        onClick={() => setSelectedUser(user)}
                        title={user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          color: user.status === 'ACTIVE' ? '#f87171' : '#fff',
                          borderColor: user.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.3)' : undefined,
                        }}
                      >
                        {user.status === 'ACTIVE' ? <Lock size={14} /> : <Unlock size={14} />}
                        <span style={{ marginLeft: '4px' }}>
                          {user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px',
              color: 'var(--muted, #94a3b8)',
            }}
          >
            <div>
              Trang {page + 1} / {totalPages} (Tổng {totalElements} kết quả)
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-dark btn-sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Trước
              </button>
              <button
                className="btn btn-dark btn-sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal: Toggle Status */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 11, 38, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={closeModal}
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
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: selectedUser.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: selectedUser.status === 'ACTIVE' ? '#f87171' : '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedUser.status === 'ACTIVE' ? <Lock size={20} /> : <Unlock size={20} />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                  {selectedUser.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--muted, #94a3b8)' }}>
                  {selectedUser.fullName} ({selectedUser.email})
                </span>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              {selectedUser.status === 'ACTIVE'
                ? 'Khi bị khóa, tài khoản này sẽ không thể đăng nhập hoặc đặt hàng trên ThunderFood.'
                : 'Mở khóa sẽ cho phép tài khoản đăng nhập và sử dụng dịch vụ bình thường trở lại.'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-ghost" onClick={closeModal} disabled={statusMutation.isPending}>
                Hủy bỏ
              </button>
              <button
                type="button"
                className={selectedUser.status === 'ACTIVE' ? 'btn btn-ghost' : 'btn btn-primary'}
                style={{
                  backgroundColor: selectedUser.status === 'ACTIVE' ? '#dc2626' : undefined,
                  color: '#fff',
                }}
                onClick={handleConfirmStatus}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? (
                  <Loader2 className="spin" size={16} />
                ) : selectedUser.status === 'ACTIVE' ? (
                  'Xác nhận khóa'
                ) : (
                  'Xác nhận mở khóa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
