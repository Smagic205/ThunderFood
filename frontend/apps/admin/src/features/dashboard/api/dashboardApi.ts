import { axiosClient } from '@/shared/api/axiosClient';
import { useAuthStore } from '@/app/store/authStore';
import type { DashboardData } from '../types';

export const MOCK_DASHBOARD_DATA: DashboardData = {
  kpis: {
    revenueToday: {
      label: 'Doanh thu hôm nay',
      value: '8.450.000 ₫',
      deltaText: '+12,4%',
      isPositive: true,
      sparkline: [5, 7, 6, 9, 8, 10, 12],
      icon: 'wallet',
    },
    ordersToday: {
      label: 'Đơn hôm nay',
      value: '38',
      deltaText: '+3 đơn',
      isPositive: true,
      sparkline: [4, 6, 5, 7, 6, 8, 9],
      icon: 'receipt',
    },
    processingOrders: {
      label: 'Đang xử lý',
      value: '14',
      deltaText: '-2 đơn',
      isPositive: false,
      sparkline: [9, 8, 10, 7, 8, 6, 5],
      icon: 'clock',
    },
    newCustomersWeek: {
      label: 'Khách mới tuần này',
      value: '24',
      deltaText: '+18%',
      isPositive: true,
      sparkline: [3, 4, 3, 5, 6, 5, 7],
      icon: 'users',
    },
  },
  revenueStats: {
    day: {
      labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
      values: [0.6, 1.2, 2.5, 0.8, 0.7, 1.6, 2.8, 0.95],
      periodTotalText: 'Hôm nay',
      unit: 'triệu ₫',
    },
    week: {
      labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      values: [6.8, 7.5, 8.1, 7.9, 9.4, 11.2, 10.3],
      periodTotalText: 'Tuần này',
      unit: 'triệu ₫',
    },
    month: {
      labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
      values: [54.2, 59.8, 62.4, 60.4],
      periodTotalText: 'Tháng này',
      unit: 'triệu ₫',
    },
  },
  orderStatusCounts: [
    { status: 'PENDING', label: 'Chờ xác nhận', count: 6, color: 'var(--c-amber)' },
    { status: 'CONFIRMED', label: 'Đã xác nhận', count: 5, color: 'var(--c-blue)' },
    { status: 'DELIVERING', label: 'Đang giao', count: 3, color: 'var(--c-teal)' },
    { status: 'DELIVERED', label: 'Đã giao', count: 22, color: 'var(--c-green)' },
    { status: 'CANCELLED', label: 'Đã hủy', count: 2, color: 'var(--c-red)' },
  ],
  topProducts: [
    {
      id: 1,
      name: 'Burger Bò Double Cheese',
      categoryName: 'Burger',
      soldCount: 1420,
      price: 85000,
      discountPrice: 79000,
      tint: 'linear-gradient(135deg, #f97316, #ef4444)',
      emoji: '🍔',
    },
    {
      id: 2,
      name: 'Pizza Hải Sản Sốt Pesto',
      categoryName: 'Pizza',
      soldCount: 1180,
      price: 165000,
      discountPrice: 155000,
      tint: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
      emoji: '🍕',
    },
    {
      id: 3,
      name: 'Gà Rán Giòn Cay Sốt Mật Ong',
      categoryName: 'Gà rán',
      soldCount: 980,
      price: 119000,
      tint: 'linear-gradient(135deg, #eab308, #f97316)',
      emoji: '🍗',
    },
    {
      id: 4,
      name: 'Mì Ý Bò Bằm Xốt Cà Chua',
      categoryName: 'Mì Ý & Pasta',
      soldCount: 760,
      price: 95000,
      discountPrice: 89000,
      tint: 'linear-gradient(135deg, #ef4444, #b91c1c)',
      emoji: '🍝',
    },
    {
      id: 5,
      name: 'Trà Đào Cam Sả Thảo Mộc',
      categoryName: 'Đồ uống',
      soldCount: 650,
      price: 45000,
      tint: 'linear-gradient(135deg, #10b981, #06b6d4)',
      emoji: '🍹',
    },
  ],
  recentOrders: [
    {
      id: 101,
      orderCode: 'ORD-9281',
      customerName: 'Lê Hoàng Nam',
      receiverPhone: '0912 345 678',
      totalAmount: 255000,
      status: 'PENDING',
      itemCount: 3,
      createdAt: '5 phút trước',
    },
    {
      id: 102,
      orderCode: 'ORD-9280',
      customerName: 'Trần Thị Mai',
      receiverPhone: '0987 654 321',
      totalAmount: 165000,
      status: 'CONFIRMED',
      itemCount: 1,
      createdAt: '18 phút trước',
    },
    {
      id: 103,
      orderCode: 'ORD-9279',
      customerName: 'Nguyễn Văn Hưng',
      receiverPhone: '0903 112 233',
      totalAmount: 412000,
      status: 'DELIVERING',
      itemCount: 4,
      createdAt: '35 phút trước',
    },
    {
      id: 104,
      orderCode: 'ORD-9278',
      customerName: 'Phạm Thu Hương',
      receiverPhone: '0938 776 655',
      totalAmount: 85000,
      status: 'DELIVERED',
      itemCount: 1,
      createdAt: '1 giờ trước',
    },
    {
      id: 105,
      orderCode: 'ORD-9277',
      customerName: 'Đỗ Tuấn Kiệt',
      receiverPhone: '0971 889 900',
      totalAmount: 310000,
      status: 'DELIVERED',
      itemCount: 2,
      createdAt: '2 giờ trước',
    },
    {
      id: 106,
      orderCode: 'ORD-9276',
      customerName: 'Vũ Đình Quang',
      receiverPhone: '0945 667 788',
      totalAmount: 195000,
      status: 'CANCELLED',
      itemCount: 2,
      createdAt: '3 giờ trước',
    },
  ],
};

export const dashboardApi = {
  getDashboardData: async (): Promise<DashboardData> => {
    const token = useAuthStore.getState().accessToken;

    // Nếu đang dùng tài khoản Demo hoặc chưa có token thật, trả về ngay Mock data
    if (!token || token.startsWith('demo-')) {
      return MOCK_DASHBOARD_DATA;
    }

    try {
      const res = await axiosClient.get('/admin/dashboard');
      // Nếu API backend trả về object DashboardData hợp lệ thì lấy, nếu không fallback mock
      if (res.data?.data && typeof res.data.data === 'object' && res.data.data.kpis) {
        return res.data.data;
      }
      return MOCK_DASHBOARD_DATA;
    } catch {
      // Backend chưa có endpoint hoặc lỗi thì fallback dữ liệu mock chuẩn hóa
      return MOCK_DASHBOARD_DATA;
    }
  },
};
