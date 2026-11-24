export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';

export interface KpiMetric {
  label: string;
  value: string | number;
  detail: string;
  icon: 'wallet' | 'receipt' | 'clock' | 'users';
}

export type TimeRange = 'day' | 'week' | 'month';

export interface RevenueChartData {
  labels: string[];
  values: number[];
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
  categoryName?: string;
  soldCount: number;
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

export interface ShipperPerformanceItem {
  staffId: number;
  staffName: string;
  email: string;
  phone: string;
  totalPackages: number;
  totalOrders: number;
  deliveredOrders: number;
  failedOrders: number;
  successRate: number;
  avgDeliveryMinutes: number;
}

export interface DashboardData {
  kpis: {
    revenueToday: KpiMetric;
    ordersToday: KpiMetric;
    processingOrders: KpiMetric;
    newCustomersWeek: KpiMetric;
  };
  revenueStats: RevenueChartData;
  orderStatusCounts: StatusCountItem[];
  topProducts: TopProductItem[];
  shipperPerformance: ShipperPerformanceItem[];
}
