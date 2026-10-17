export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';

export interface KpiMetric {
  label: string;
  value: string | number;
  deltaText: string;
  isPositive: boolean;
  sparkline: number[];
  icon: 'wallet' | 'receipt' | 'clock' | 'users';
}

export type TimeRange = 'day' | 'week' | 'month';

export interface RevenueChartData {
  labels: string[];
  values: number[]; // Số triệu VNĐ
  periodTotalText: string;
  unit: string;
}

export interface StatusCountItem {
  status: OrderStatus;
  label: string;
  count: number;
  color: string;
}

export interface TopProductItem {
  id: number;
  name: string;
  categoryName: string;
  soldCount: number;
  price: number;
  discountPrice?: number;
  tint?: string;
  emoji?: string;
}

export interface RecentOrderItem {
  id: number;
  orderCode: string;
  customerName: string;
  receiverPhone: string;
  totalAmount: number;
  status: OrderStatus;
  itemCount: number;
  createdAt: string;
}

export interface DashboardData {
  kpis: {
    revenueToday: KpiMetric;
    ordersToday: KpiMetric;
    processingOrders: KpiMetric;
    newCustomersWeek: KpiMetric;
  };
  revenueStats: Record<TimeRange, RevenueChartData>;
  orderStatusCounts: StatusCountItem[];
  topProducts: TopProductItem[];
  recentOrders: RecentOrderItem[];
}
