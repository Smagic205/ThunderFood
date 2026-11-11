import { axiosClient } from '@/shared/api/axiosClient';
import { useAuthStore } from '@/app/store/authStore';
import type { DashboardData, ShipperPerformanceItem, TopProductItem } from '../types';

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
  ],
  shipperPerformance: [
    {
      staffId: 2,
      staffName: 'Nguyễn Văn Hùng',
      email: 'shipper.hung@thunderfood.vn',
      phone: '0987654321',
      totalPackages: 18,
      totalOrders: 42,
      deliveredOrders: 40,
      failedOrders: 2,
      successRate: 95.2,
      avgDeliveryMinutes: 26,
    },
  ],
};

function formatVnd(val: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
}

export const dashboardApi = {
  getDashboardData: async (): Promise<DashboardData> => {
    const token = useAuthStore.getState().accessToken;

    if (!token || token.startsWith('demo-')) {
      return MOCK_DASHBOARD_DATA;
    }

    try {
      // Gọi song song các API backend mới hoàn thiện
      const [summaryRes, chartRes, topProductsRes, shippersRes] = await Promise.allSettled([
        axiosClient.get('/admin/dashboard/summary'),
        axiosClient.get('/admin/dashboard/revenue-chart'),
        axiosClient.get('/admin/dashboard/top-products?limit=5'),
        axiosClient.get('/admin/dashboard/shipper-performance'),
      ]);

      const summary = summaryRes.status === 'fulfilled' ? summaryRes.value.data?.data : null;
      const chartPoints = chartRes.status === 'fulfilled' ? chartRes.value.data?.data : null;
      const topProducts = topProductsRes.status === 'fulfilled' ? topProductsRes.value.data?.data : null;
      const shippers = shippersRes.status === 'fulfilled' ? shippersRes.value.data?.data : null;

      if (!summary) {
        return MOCK_DASHBOARD_DATA;
      }

      // Xây dựng KPIs từ summary
      const totalRev = Number(summary.totalRevenue) || 0;
      const growthRate = summary.revenueGrowthRate ?? 0;
      const totalOrders = Number(summary.totalOrders) || 0;
      const processingOrders = (Number(summary.pendingOrders) || 0) + (Number(summary.confirmedOrders) || 0);
      const newCustomers = Number(summary.newCustomersCount) || 0;

      const kpis = {
        revenueToday: {
          label: 'Tổng doanh thu',
          value: formatVnd(totalRev),
          deltaText: `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
          isPositive: growthRate >= 0,
          sparkline: [5, 7, 6, 8, 10, 12, 14],
          icon: 'wallet' as const,
        },
        ordersToday: {
          label: 'Tổng đơn hàng',
          value: String(totalOrders),
          deltaText: `+${summary.deliveredOrders || 0} đã giao`,
          isPositive: true,
          sparkline: [4, 6, 7, 6, 8, 9, 10],
          icon: 'receipt' as const,
        },
        processingOrders: {
          label: 'Đang xử lý',
          value: String(processingOrders),
          deltaText: `${summary.pendingOrders || 0} chờ duyệt`,
          isPositive: processingOrders <= 5,
          sparkline: [8, 7, 9, 6, 5, 4, processingOrders],
          icon: 'clock' as const,
        },
        newCustomersWeek: {
          label: 'Khách hàng mới',
          value: String(newCustomers),
          deltaText: 'Kỳ này',
          isPositive: true,
          sparkline: [2, 4, 3, 5, 6, 7, newCustomers],
          icon: 'users' as const,
        },
      };

      // Xây dựng orderStatusCounts
      const orderStatusCounts = [
        { status: 'PENDING' as const, label: 'Chờ xác nhận', count: Number(summary.pendingOrders) || 0, color: 'var(--c-amber)' },
        { status: 'CONFIRMED' as const, label: 'Đã xác nhận', count: Number(summary.confirmedOrders) || 0, color: 'var(--c-blue)' },
        { status: 'DELIVERING' as const, label: 'Đang giao', count: Number(summary.deliveringOrders) || 0, color: 'var(--c-teal)' },
        { status: 'DELIVERED' as const, label: 'Đã giao', count: Number(summary.deliveredOrders) || 0, color: 'var(--c-green)' },
        { status: 'CANCELLED' as const, label: 'Đã hủy', count: Number(summary.cancelledOrders) || 0, color: 'var(--c-red)' },
      ];

      // Biểu đồ doanh thu từ backend chartPoints
      let revenueStats = { ...MOCK_DASHBOARD_DATA.revenueStats };
      if (Array.isArray(chartPoints) && chartPoints.length > 0) {
        const labels = chartPoints.map((p: any) => {
          const l = p.label || '';
          return l.length > 5 ? l.substring(5) : l; // '11-10' từ '2026-11-10'
        });
        const values = chartPoints.map((p: any) => {
          const rev = Number(p.revenue) || 0;
          return Number((rev / 1000000).toFixed(2)); // Quy ra triệu VNĐ
        });

        revenueStats.day = {
          labels,
          values,
          periodTotalText: 'Tháng này',
          unit: 'triệu ₫',
        };
      }

      // Top sản phẩm bán chạy từ backend
      let formattedTopProducts: TopProductItem[] = MOCK_DASHBOARD_DATA.topProducts;
      if (Array.isArray(topProducts) && topProducts.length > 0) {
        const tints = [
          'linear-gradient(135deg, #f97316, #ef4444)',
          'linear-gradient(135deg, #06b6d4, #3b82f6)',
          'linear-gradient(135deg, #eab308, #f97316)',
          'linear-gradient(135deg, #ef4444, #b91c1c)',
          'linear-gradient(135deg, #10b981, #06b6d4)',
        ];
        const emojis = ['🍔', '🍕', '🍗', '🍝', '🍹'];

        formattedTopProducts = topProducts.map((p: any, idx: number) => ({
          id: p.productId || idx + 1,
          name: p.productName || 'Sản phẩm',
          categoryName: p.categoryName || 'Món ăn',
          soldCount: Number(p.soldQuantity) || 0,
          price: Number(p.totalRevenue) && Number(p.soldQuantity) ? Math.round(Number(p.totalRevenue) / Number(p.soldQuantity)) : 50000,
          tint: tints[idx % tints.length],
          emoji: emojis[idx % emojis.length],
        }));
      }

      // Shipper performance
      const formattedShippers: ShipperPerformanceItem[] = Array.isArray(shippers) ? shippers : MOCK_DASHBOARD_DATA.shipperPerformance || [];

      return {
        kpis,
        revenueStats,
        orderStatusCounts,
        topProducts: formattedTopProducts,
        recentOrders: MOCK_DASHBOARD_DATA.recentOrders,
        shipperPerformance: formattedShippers,
      };
    } catch {
      return MOCK_DASHBOARD_DATA;
    }
  },

  // Xuất file Excel báo cáo đơn hàng
  exportOrdersExcel: async (startDate?: string, endDate?: string) => {
    const res = await axiosClient.get('/admin/reports/export/excel', {
      params: { startDate, endDate },
      responseType: 'blob',
    });
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `thunderfood_orders_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Xuất file PDF báo cáo tài chính
  exportRevenuePdf: async (startDate?: string, endDate?: string) => {
    const res = await axiosClient.get('/admin/reports/export/pdf', {
      params: { startDate, endDate },
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `thunderfood_revenue_report_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
