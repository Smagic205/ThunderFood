import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, Download, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/app/store/authStore';
import { dashboardApi } from '../api/dashboardApi';
import type { TimeRange } from '../types';
import { KpiCards } from '../components/KpiCards';
import { RevenueChart } from '../components/RevenueChart';
import { OrderStatusDonut } from '../components/OrderStatusDonut';
import { TopProductsCard } from '../components/TopProductsCard';
import { RecentOrdersCard } from '../components/RecentOrdersCard';

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('day');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => dashboardApi.getDashboardData(),
    staleTime: 60 * 1000,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Định dạng ngày tiếng Việt: ví dụ "Thứ Bảy, 11/10/2026"
  const getFormattedDate = () => {
    const today = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[today.getDay()];
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dayName}, ${dd}/${mm}/${yyyy}`;
  };

  const adminName = user?.fullName || 'Quản trị viên';

  if (isLoading || !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)' }}>
        <RefreshCw size={32} className="spin" style={{ margin: '0 auto 12px' }} />
        <p>Đang tải dữ liệu tổng quan quản trị...</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            backgroundColor: 'var(--surface-2)',
            color: 'var(--ink)',
            border: '1px solid var(--border)',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fade 0.2s ease',
          }}
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Page Header */}
      <div className="ah">
        <div>
          <h2>Xin chào, {adminName}</h2>
          <p>
            {getFormattedDate()}. Đây là tình hình hoạt động kinh doanh hôm nay.
          </p>
        </div>
        <div className="row wrap" style={{ gap: '10px' }}>
          <button
            className="btn btn-ghost"
            onClick={() => refetch()}
            disabled={isRefetching}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} className={isRefetching ? 'spin' : ''} />
            Làm mới
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => showToast('Đang tạo báo cáo Excel... Tệp sẽ sẵn sàng tải xuống.')}
          >
            <FileSpreadsheet size={16} />
            Xuất Excel
          </button>
          <button
            className="btn btn-dark"
            onClick={() => showToast('Đang tạo bản in PDF tổng quan...')}
          >
            <Download size={16} />
            Xuất PDF
          </button>
        </div>
      </div>

      {/* 4 Thẻ KPI */}
      <KpiCards
        revenueToday={data.kpis.revenueToday}
        ordersToday={data.kpis.ordersToday}
        processingOrders={data.kpis.processingOrders}
        newCustomersWeek={data.kpis.newCustomersWeek}
      />

      {/* Grid Biểu đồ Doanh thu & Tỷ lệ đơn theo trạng thái */}
      <div className="dash-grid">
        <RevenueChart
          stats={data.revenueStats}
          selectedRange={selectedRange}
          onRangeChange={(range) => setSelectedRange(range)}
        />
        <OrderStatusDonut items={data.orderStatusCounts} />
      </div>

      {/* Grid 2 cột: Món bán chạy & Đơn hàng gần đây */}
      <div className="dash-grid two">
        <TopProductsCard products={data.topProducts} />
        <RecentOrdersCard orders={data.recentOrders} />
      </div>
    </div>
  );
};
