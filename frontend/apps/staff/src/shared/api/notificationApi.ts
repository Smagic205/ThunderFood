import { axiosClient } from './axiosClient';

export interface StaffNotification {
  id: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface NotificationPage {
  content: StaffNotification[];
  pagination: PaginationInfo;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const notificationApi = {
  getPage: async (page = 0, size = 15): Promise<NotificationPage> => {
    const response = await axiosClient.get<ApiResponse<NotificationPage>>('/v1/notifications', {
      params: { page, size },
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tải thông báo');
    }
    return response.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await axiosClient.get<ApiResponse<number>>('/v1/notifications/unread-count');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tải số thông báo chưa đọc');
    }
    return response.data.data;
  },

  markAsRead: async (id: number): Promise<StaffNotification> => {
    const response = await axiosClient.patch<ApiResponse<StaffNotification>>(`/v1/notifications/${id}/read`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể đánh dấu thông báo đã đọc');
    }
    return response.data.data;
  },

  markAllAsRead: async (): Promise<void> => {
    const response = await axiosClient.patch<ApiResponse<void>>('/v1/notifications/read-all');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể đánh dấu tất cả thông báo đã đọc');
    }
  },
};
