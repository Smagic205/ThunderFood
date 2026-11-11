import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Bell, Check, CheckCheck, Loader2, Tag, Truck } from 'lucide-react';
import { useAuthStore } from '@/app/store/authStore';
import { notificationApi, type UserNotification } from '@/shared/api/notificationApi';

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
};

const getNotificationIcon = (type: string) => {
  if (type === 'ORDER_STATUS') return <Truck size={19} />;
  if (type === 'PROMOTION') return <Tag size={19} />;
  return <Bell size={19} />;
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Không thể tải thông báo.';

export const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [page, setPage] = useState(0);

  const notificationsQuery = useQuery({
    queryKey: ['my-notifications', user?.id, page],
    queryFn: () => notificationApi.getPage(page, 15),
    enabled: Boolean(user?.id),
    staleTime: 15_000,
  });
  const unreadQuery = useQuery({
    queryKey: ['notification-unread-count', user?.id],
    queryFn: notificationApi.getUnreadCount,
    enabled: Boolean(user?.id),
    refetchInterval: 30_000,
  });

  const refreshNotificationData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['my-notifications', user?.id] }),
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count', user?.id] }),
    ]);
  };

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: refreshNotificationData,
  });
  const markAllMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: refreshNotificationData,
  });

  const handleOpenNotification = (notification: UserNotification) => {
    if (!notification.isRead) markReadMutation.mutate(notification.id);
    if (notification.type === 'ORDER_STATUS') navigate('/account/orders');
    else if (notification.type === 'PROMOTION') navigate('/menu');
  };

  const notifications = notificationsQuery.data?.content ?? [];
  const pagination = notificationsQuery.data?.pagination;

  return (
    <div>
      <div className="page-h" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 2.2vw, 2.2rem)' }}>Thông báo</h1>
          <p className="muted" style={{ fontSize: '14.5px', marginTop: 4 }}>
            {unreadQuery.data ?? 0} thông báo chưa đọc.
          </p>
        </div>
        {(unreadQuery.data ?? 0) > 0 && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            {markAllMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={16} />}
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {markReadMutation.isError || markAllMutation.isError ? (
        <div className="card card-p mb-4 text-red-600" role="alert">Không thể cập nhật trạng thái thông báo. Vui lòng thử lại.</div>
      ) : null}

      {notificationsQuery.isLoading ? (
        <div className="py-20 text-center text-[var(--ink-2)]">
          <Loader2 size={30} className="animate-spin text-[var(--volt)] mx-auto mb-3" />
          Đang tải thông báo…
        </div>
      ) : notificationsQuery.isError ? (
        <div className="empty card text-center" role="alert">
          <AlertCircle size={30} className="mx-auto mb-2 text-red-500" />
          <h3>Không tải được thông báo</h3>
          <p>{errorMessage(notificationsQuery.error)}</p>
          <button className="btn btn-ghost btn-sm mt-3" onClick={() => notificationsQuery.refetch()}>Thử lại</button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty card">
          <div className="art-wrap text-[#0F7F59] bg-green-50 dark:bg-green-950/40"><Bell size={48} /></div>
          <h3>Chưa có thông báo</h3>
          <p>Các cập nhật về đơn hàng và ưu đãi sẽ hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <button
              type="button"
              key={notification.id}
              onClick={() => handleOpenNotification(notification)}
              className={`card w-full text-left p-4 border transition-colors ${notification.isRead ? 'border-[var(--line)]' : 'border-[var(--volt)] bg-[var(--volt-soft)]/40'}`}
            >
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--c-amber)] shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <b className="text-sm text-[var(--ink)]">{notification.title}</b>
                    {!notification.isRead && <span className="w-2 h-2 rounded-full bg-[var(--c-red)] shrink-0" aria-label="Chưa đọc" />}
                  </span>
                  <span className="block text-sm text-[var(--ink-2)] mt-1">{notification.content}</span>
                  <span className="block text-xs text-[var(--ink-3)] mt-2">{formatDate(notification.createdAt)}</span>
                </span>
                {notification.isRead && <Check size={16} className="text-emerald-600 shrink-0" aria-label="Đã đọc" />}
              </div>
            </button>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-6">
          <button className="btn btn-ghost btn-sm" disabled={!pagination.hasPrevious} onClick={() => setPage((value) => Math.max(0, value - 1))}>Trang trước</button>
          <span className="text-xs text-[var(--ink-2)]">Trang {pagination.page + 1} / {pagination.totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={!pagination.hasNext} onClick={() => setPage((value) => value + 1)}>Trang sau</button>
        </div>
      )}
    </div>
  );
};
