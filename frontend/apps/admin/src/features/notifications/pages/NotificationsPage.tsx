import { useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Bell, Check, CheckCheck, ChevronLeft, ChevronRight, Loader2, Package, Receipt } from 'lucide-react';
import { useAuthStore } from '@/app/store/authStore';
import { notificationApi, type AdminNotification } from '@/shared/api/notificationApi';

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
};
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Không thể tải thông báo.';

export const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(0);

  const notificationsQuery = useQuery({
    queryKey: ['admin-notifications', user?.id, page],
    queryFn: () => notificationApi.getPage(page, 15),
    enabled: Boolean(user?.id),
    staleTime: 15_000,
  });
  const unreadQuery = useQuery({
    queryKey: ['admin-notification-unread-count', user?.id],
    queryFn: notificationApi.getUnreadCount,
    enabled: Boolean(user?.id),
    refetchInterval: 30_000,
  });

  const refreshNotifications = async () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin-notifications', user?.id] }),
    queryClient.invalidateQueries({ queryKey: ['admin-notification-unread-count', user?.id] }),
  ]);
  const markReadMutation = useMutation({ mutationFn: notificationApi.markAsRead, onSuccess: refreshNotifications });
  const markAllMutation = useMutation({ mutationFn: notificationApi.markAllAsRead, onSuccess: refreshNotifications });

  const openNotification = (notification: AdminNotification) => {
    if (!notification.isRead) markReadMutation.mutate(notification.id);
    if (notification.type.toUpperCase().includes('PACKAGE')) navigate('/admin/packages');
    else if (notification.type.toUpperCase().includes('ORDER')) navigate('/admin/orders');
  };

  const notifications = notificationsQuery.data?.content ?? [];
  const pagination = notificationsQuery.data?.pagination;

  return (
    <>
      <div className="ah">
        <div><h2>Thông báo</h2><p>{unreadQuery.data ?? 0} thông báo chưa đọc.</p></div>
        {(unreadQuery.data ?? 0) > 0 && (
          <button className="btn btn-ghost btn-sm" disabled={markAllMutation.isPending} onClick={() => markAllMutation.mutate()}>
            {markAllMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={16} />} Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {(markReadMutation.isError || markAllMutation.isError) && <div className="card card-p" role="alert" style={{ marginBottom: 16, color: 'var(--c-red)' }}>Không thể cập nhật thông báo. Vui lòng thử lại.</div>}

      {notificationsQuery.isLoading ? (
        <div className="empty card" style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} className="animate-spin" /><p className="muted">Đang tải thông báo…</p></div>
      ) : notificationsQuery.isError ? (
        <div className="empty card" role="alert" style={{ padding: 40, textAlign: 'center' }}><AlertCircle size={28} style={{ color: 'var(--c-red)' }} /><h3>Không tải được thông báo</h3><p className="muted">{errorMessage(notificationsQuery.error)}</p><button className="btn btn-soft btn-sm" onClick={() => notificationsQuery.refetch()}>Thử lại</button></div>
      ) : notifications.length === 0 ? (
        <div className="empty card" style={{ padding: 40, textAlign: 'center' }}><Bell size={32} className="muted" /><h3>Chưa có thông báo</h3><p className="muted">Các cập nhật cho tài khoản quản trị sẽ xuất hiện tại đây.</p></div>
      ) : (
        <div className="stack" style={{ display: 'grid', gap: 12 }}>
          {notifications.map((notification) => {
            const type = notification.type.toUpperCase();
            const Icon = type.includes('PACKAGE') ? Package : type.includes('ORDER') ? Receipt : Bell;
            return (
              <button key={notification.id} type="button" className="card card-p" onClick={() => openNotification(notification)} style={{ width: '100%', textAlign: 'left', borderColor: notification.isRead ? 'var(--line)' : 'var(--volt)', background: notification.isRead ? 'var(--surface)' : 'var(--volt-soft)' }}>
                <span className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
              <span className="tile xs" style={{ flexShrink: 0, '--tint': 'var(--volt)' } as CSSProperties}><Icon size={19} /></span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="row wrap" style={{ gap: 8 }}><b style={{ color: 'var(--ink)' }}>{notification.title}</b>{!notification.isRead && <span className="pill s-PENDING nodot">Chưa đọc</span>}</span>
                    <span className="muted" style={{ display: 'block', marginTop: 4, whiteSpace: 'pre-wrap' }}>{notification.content}</span>
                    <span className="faint" style={{ display: 'block', fontSize: 12, marginTop: 8 }}>{formatDate(notification.createdAt)}</span>
                  </span>
                  {notification.isRead && <Check size={17} className="ic" aria-label="Đã đọc" />}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="row between wrap" style={{ padding: '16px 4px', gap: 12 }}>
          <span className="muted" style={{ fontSize: 13 }}>Trang {pagination.page + 1} / {pagination.totalPages}</span>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-soft btn-sm" disabled={!pagination.hasPrevious || notificationsQuery.isFetching} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft size={16} /> Trang trước</button>
            <button className="btn btn-soft btn-sm" disabled={!pagination.hasNext || notificationsQuery.isFetching} onClick={() => setPage((value) => value + 1)}>Trang sau <ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </>
  );
};
