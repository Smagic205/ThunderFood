import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, FileSpreadsheet, Download, RefreshCw, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/app/store/authStore';
import { dashboardApi } from '../api/dashboardApi';
import type { TimeRange } from '../types';
import { KpiCards } from '../components/KpiCards';
import { RevenueChart } from '../components/RevenueChart';
import { OrderStatusDonut } from '../components/OrderStatusDonut';
import { TopProductsCard } from '../components/TopProductsCard';
import { ShipperPerformanceCard } from '../components/ShipperPerformanceCard';

const formatDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultExportRange = () => {
  const end = new Date();
  const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  const start = new Date(end.getFullYear(), end.getMonth() - 1, Math.min(end.getDate(), prevMonthLastDay));
  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(end),
  };
};

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('day');
  const [{ startDate: defaultStartDate, endDate: defaultEndDate }] = useState(getDefaultExportRange);
  const [exportStartDate, setExportStartDate] = useState(defaultStartDate);
  const [exportEndDate, setExportEndDate] = useState(defaultEndDate);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['admin-dashboard', selectedRange],
    queryFn: () => dashboardApi.getDashboardData(selectedRange),
    staleTime: 60 * 1000,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const isInvalidExportRange = Boolean(exportStartDate && exportEndDate && exportStartDate > exportEndDate);

  const handleExportExcel = async () => {
    if (isInvalidExportRange) {
      showToast('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }
    try {
      setIsExportingExcel(true);
      showToast('Đang tạo báo cáo Excel... Tệp sẽ sẵn sàng tải xuống ngay.');
      await dashboardApi.exportOrdersExcel(exportStartDate || undefined, exportEndDate || undefined);
      showToast('Đã tải xuống báo cáo Excel thành công!');
    } catch {
      showToast('Không thể xuất báo cáo Excel từ máy chủ.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    if (isInvalidExportRange) {
      showToast('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }
    try {
      setIsExportingPdf(true);
      showToast('Đang kết xuất báo cáo tài chính PDF...');
      await dashboardApi.exportRevenuePdf(exportStartDate || undefined, exportEndDate || undefined);
      showToast('Đã tải xuống báo cáo PDF thành công!');
    } catch {
      showToast('Không thể xuất báo cáo PDF từ máy chủ.');
    } finally {
      setIsExportingPdf(false);
    }
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

  if (isError) {
    return (
      <div className="card card-p" role="alert" style={{ textAlign: 'center', padding: '40px' }}>
        <p>Không thể tải dữ liệu tổng quan từ máy chủ.</p>
        <button className="btn btn-primary" onClick={() => refetch()}>Thử lại</button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)' }}>
        <RefreshCw size={32} className="spin" style={{ margin: '0 auto 12px' }} />
        <p>Đang tải dữ liệu tổng quan quản trị...</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            {getFormattedDate()}. Dữ liệu được tổng hợp theo khoảng thời gian đã chọn.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'inline-flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px',
              minHeight: '44px',
              padding: '4px 14px',
              borderRadius: '999px',
              background: 'var(--surface)',
              border: '1.5px solid var(--line)',
            }}
            aria-label="Khoảng thời gian xuất báo cáo"
          >
            <Calendar size={15} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ink-2)', fontWeight: 500 }}>
              <span>Từ</span>
              <input
                type="date"
                aria-label="Từ ngày"
                value={exportStartDate}
                max={exportEndDate || undefined}
                onChange={(e) => setExportStartDate(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink)',
                  font: 'inherit',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </label>
            <span style={{ color: 'var(--ink-3)', fontSize: '13px' }}>–</span>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ink-2)', fontWeight: 500 }}>
              <span>Đến</span>
              <input
                type="date"
                aria-label="Đến ngày"
                value={exportEndDate}
                min={exportStartDate || undefined}
                onChange={(e) => setExportEndDate(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink)',
                  font: 'inherit',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </label>
          </div>
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
            onClick={handleExportExcel}
            disabled={isExportingExcel || isInvalidExportRange}
            title="Xuất danh sách đơn hàng theo khoảng ngày đã chọn sang file Excel (.xlsx)"
          >
            {isExportingExcel ? <Loader2 className="spin" size={16} /> : <FileSpreadsheet size={16} />}
            Xuất Excel
          </button>
          <button
            className="btn btn-dark"
            onClick={handleExportPdf}
            disabled={isExportingPdf || isInvalidExportRange}
            title="Xuất báo cáo tài chính tổng hợp theo khoảng ngày đã chọn sang file PDF"
          >
            {isExportingPdf ? <Loader2 className="spin" size={16} /> : <Download size={16} />}
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

      {/* Món bán chạy */}
      <div className="dash-grid two">
        <TopProductsCard products={data.topProducts} />
      </div>

      {/* Hiệu suất giao hàng của nhân viên / Shipper */}
      {data.shipperPerformance && data.shipperPerformance.length > 0 && (
        <ShipperPerformanceCard shippers={data.shipperPerformance} />
      )}
    </div>
  );
};
