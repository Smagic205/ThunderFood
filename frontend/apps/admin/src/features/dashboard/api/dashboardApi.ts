import { axiosClient } from '@/shared/api/axiosClient';
import type { DashboardData, ShipperPerformanceItem, TimeRange, TopProductItem } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const formatVnd = (value: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPeriod = (range: TimeRange) => {
  const endDate = new Date();
  const startDate = new Date(endDate);

  if (range === 'week') {
    const daysSinceMonday = (endDate.getDay() + 6) % 7;
    startDate.setDate(endDate.getDate() - daysSinceMonday);
  } else if (range === 'month') {
    startDate.setDate(1);
  }

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    label: range === 'day' ? 'hôm nay' : range === 'week' ? 'tuần này' : 'tháng này',
  };
};

function getData<T>(response: ApiResponse<T>, fallbackMessage: string): T {
  if (!response?.success || response.data == null) {
    throw new Error(response?.message || fallbackMessage);
  }
  return response.data;
}

export const dashboardApi = {
  getDashboardData: async (range: TimeRange = 'day'): Promise<DashboardData> => {
    const period = getPeriod(range);
    const dateParams = { startDate: period.startDate, endDate: period.endDate };
    const summaryParams = range === 'day' ? { period: 'TODAY' } : dateParams;

    const [summaryRes, chartRes, topProductsRes, shippersRes] = await Promise.all([
      axiosClient.get<ApiResponse<any>>('/admin/dashboard/summary', { params: summaryParams }),
      axiosClient.get<ApiResponse<any[]>>('/admin/dashboard/revenue-chart', { params: dateParams }),
      axiosClient.get<ApiResponse<any[]>>('/admin/dashboard/top-products', { params: { ...dateParams, limit: 5 } }),
      axiosClient.get<ApiResponse<ShipperPerformanceItem[]>>('/admin/dashboard/shipper-performance', { params: dateParams }),
    ]);

    const summary = getData(summaryRes.data, 'Không thể tải dữ liệu tổng quan');
    const chartPoints = getData(chartRes.data, 'Không thể tải biểu đồ doanh thu');
    const products = getData(topProductsRes.data, 'Không thể tải món bán chạy');
    const shippers = getData(shippersRes.data, 'Không thể tải hiệu suất giao hàng');

    const revenueGrowthRate = Number(summary.revenueGrowthRate ?? 0);
    const growthLabel = `${revenueGrowthRate > 0 ? '+' : ''}${revenueGrowthRate.toFixed(1)}% so với kỳ trước`;
    const pendingOrders = Number(summary.pendingOrders ?? 0);
    const confirmedOrders = Number(summary.confirmedOrders ?? 0);
    const totalRevenue = Number(summary.totalRevenue ?? 0);
    const totalOrders = Number(summary.totalOrders ?? 0);
    const deliveredOrders = Number(summary.deliveredOrders ?? 0);
    const newCustomers = Number(summary.newCustomersCount ?? 0);

    const topProducts: TopProductItem[] = products.map((product: any) => ({
      id: Number(product.productId),
      name: product.productName,
      categoryName: product.categoryName || undefined,
      soldCount: Number(product.soldQuantity ?? 0),
    }));

    return {
      kpis: {
        revenueToday: {
          label: range === 'day' ? 'Doanh thu hôm nay' : range === 'week' ? 'Doanh thu tuần này' : 'Doanh thu tháng này',
          value: formatVnd(totalRevenue),
          detail: growthLabel,
          icon: 'wallet',
        },
        ordersToday: {
          label: range === 'day' ? 'Đơn hôm nay' : range === 'week' ? 'Đơn tuần này' : 'Đơn tháng này',
          value: totalOrders,
          detail: `${deliveredOrders} đơn đã giao`,
          icon: 'receipt',
        },
        processingOrders: {
          label: 'Đang xử lý',
          value: pendingOrders + confirmedOrders,
          detail: `${pendingOrders} chờ xác nhận · ${confirmedOrders} đã xác nhận`,
          icon: 'clock',
        },
        newCustomersWeek: {
          label: range === 'day' ? 'Khách mới hôm nay' : range === 'week' ? 'Khách mới tuần này' : 'Khách mới tháng này',
          value: newCustomers,
          detail: 'Trong kỳ đang xem',
          icon: 'users',
        },
      },
      revenueStats: {
        labels: chartPoints.map((point: any) => String(point.label ?? '').slice(5)),
        values: chartPoints.map((point: any) => Number((Number(point.revenue ?? 0) / 1_000_000).toFixed(2))),
        periodTotalText: period.label,
        unit: 'triệu ₫',
      },
      orderStatusCounts: [
        { status: 'PENDING', label: 'Chờ xác nhận', count: pendingOrders, color: 'var(--c-amber)' },
        { status: 'CONFIRMED', label: 'Đã xác nhận', count: confirmedOrders, color: 'var(--c-blue)' },
        { status: 'DELIVERING', label: 'Đang giao', count: Number(summary.deliveringOrders ?? 0), color: 'var(--c-teal)' },
        { status: 'DELIVERED', label: 'Đã giao', count: deliveredOrders, color: 'var(--c-green)' },
        { status: 'CANCELLED', label: 'Đã hủy', count: Number(summary.cancelledOrders ?? 0), color: 'var(--c-red)' },
      ],
      topProducts,
      shipperPerformance: shippers,
    };
  },

  exportOrdersExcel: async (startDate?: string, endDate?: string) => {
    const res = await axiosClient.get('/admin/reports/export/excel', {
      params: { startDate, endDate },
      responseType: 'blob',
    });
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const dateSuffix = startDate && endDate ? `${startDate}_${endDate}` : startDate || endDate || new Date().toISOString().slice(0, 10);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `thunderfood_orders_report_${dateSuffix}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  exportRevenuePdf: async (startDate?: string, endDate?: string) => {
    const res = await axiosClient.get('/admin/reports/export/pdf', {
      params: { startDate, endDate },
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const dateSuffix = startDate && endDate ? `${startDate}_${endDate}` : startDate || endDate || new Date().toISOString().slice(0, 10);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `thunderfood_revenue_report_${dateSuffix}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
