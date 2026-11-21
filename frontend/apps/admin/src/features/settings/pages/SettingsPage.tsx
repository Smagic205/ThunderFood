import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sliders,
  MapPin,
  Save,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  DollarSign,
  Power,
  Truck,
  Package,
  Clock,
  PhoneCall,
  Percent,
} from 'lucide-react';
import { settingsApi } from '../api/settingsApi';
import { EditShippingFeeModal } from '../components/EditShippingFeeModal';
import type { SystemSetting, ServiceWard } from '../types';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'SYSTEM' | 'WARDS'>('SYSTEM');

  // Tab 1: System Settings Form State
  const [formSettings, setFormSettings] = useState<Record<string, string>>({
    FREESHIP_THRESHOLD: '300000',
    MAX_ORDERS_PER_PACKAGE: '3',
    DEFAULT_SHIPPING_FEE: '20000',
    STORE_HOTLINE: '1900 6868',
    ESTIMATED_DELIVERY_MINUTES: '30',
  });

  // Tab 2: Service Wards State
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [wardKeyword, setWardKeyword] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [wardPage, setWardPage] = useState<number>(0);
  const [editingWard, setEditingWard] = useState<ServiceWard | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Query: System Settings
  const { data: settingsData = [] } = useQuery<SystemSetting[]>({
    queryKey: ['admin-settings'],
    queryFn: settingsApi.getAllSettings,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (settingsData && settingsData.length > 0) {
      const map: Record<string, string> = {};
      settingsData.forEach((s) => {
        map[s.key] = s.value;
      });
      setFormSettings((prev) => ({ ...prev, ...map }));
    }
  }, [settingsData]);

  // Query: Districts
  const { data: districts = [] } = useQuery<string[]>({
    queryKey: ['admin-ward-districts'],
    queryFn: settingsApi.getDistricts,
    staleTime: 5 * 60 * 1000,
  });

  // Query: Service Wards
  const { data: wardsData, isLoading: isLoadingWards } = useQuery({
    queryKey: ['admin-wards', { district: districtFilter, keyword: wardKeyword, active: activeFilter, page: wardPage }],
    queryFn: () =>
      settingsApi.getWards({
        district: districtFilter,
        keyword: wardKeyword,
        isActive: activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE',
        page: wardPage,
        size: 10,
      }),
    staleTime: 15 * 1000,
  });

  const wards = wardsData?.content || [];
  const totalWards = wardsData?.totalElements || 0;
  const totalWardPages = wardsData?.totalPages || 1;

  // Mutation: Save System Settings
  const saveSettingsMutation = useMutation({
    mutationFn: (settingsMap: Record<string, string>) => settingsApi.updateSettings(settingsMap),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      showToast('Cập nhật cấu hình hệ thống thành công!');
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể lưu cài đặt hệ thống', 'error');
    },
  });

  // Mutation: Update Shipping Fee
  const updateFeeMutation = useMutation({
    mutationFn: ({ id, fee }: { id: number; fee: number }) => settingsApi.updateShippingFee(id, fee),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-wards'] });
      showToast(`Đã cập nhật phí ship cho phường ${updated.wardName} thành công!`);
      setEditingWard(null);
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể cập nhật phí giao hàng', 'error');
    },
  });

  // Mutation: Toggle Ward Active
  const toggleWardMutation = useMutation({
    mutationFn: (id: number) => settingsApi.toggleWardActive(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-wards'] });
      showToast(`Đã ${updated.isActive ? 'bật' : 'tắt'} phục vụ cho phường ${updated.wardName}!`);
    },
    onError: (err: any) => {
      showToast(err?.message || 'Không thể đổi trạng thái phục vụ', 'error');
    },
  });

  const handleSettingChange = (key: string, value: string) => {
    setFormSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate(formSettings);
  };

  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Alert */}
      {toast && (
        <div
          className="card card-p"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#064e3b' : '#7f1d1d',
            border: `1px solid ${toast.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: '#fff',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            maxWidth: '400px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <div style={{ fontSize: '14px', lineHeight: 1.4 }}>{toast.message}</div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink, #fff)', margin: 0 }}>
            Cấu hình & Địa bàn phục vụ
          </h2>
          <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
            Thiết lập các thông số vận hành hệ thống, biểu phí ship và danh sách phường/xã phục vụ
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.1))', paddingBottom: '2px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('SYSTEM')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'SYSTEM' ? 'var(--surface-1, #1e2238)' : 'transparent',
            color: activeTab === 'SYSTEM' ? '#fff' : 'var(--muted, #94a3b8)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            borderBottom: activeTab === 'SYSTEM' ? '2px solid var(--c-blue, #3b82f6)' : 'none',
          }}
        >
          <Sliders size={16} />
          <span>Cấu hình chung hệ thống</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('WARDS')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'WARDS' ? 'var(--surface-1, #1e2238)' : 'transparent',
            color: activeTab === 'WARDS' ? '#fff' : 'var(--muted, #94a3b8)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            borderBottom: activeTab === 'WARDS' ? '2px solid var(--c-blue, #3b82f6)' : 'none',
          }}
        >
          <MapPin size={16} />
          <span>Khu vực & Phí giao hàng ({totalWards})</span>
        </button>
      </div>

      {/* TAB 1: SYSTEM SETTINGS */}
      {activeTab === 'SYSTEM' && (
        <div className="card card-p" style={{ maxWidth: '800px', backgroundColor: 'var(--surface-1, #1e2238)' }}>
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.08))', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                  Thông số vận hành cốt lõi
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--muted, #94a3b8)' }}>
                  Các thông số này sẽ trực tiếp ảnh hưởng đến thuật toán gom đơn và tính phí khách hàng
                </span>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saveSettingsMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {saveSettingsMutation.isPending ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
                <span>Lưu cấu hình</span>
              </button>
            </div>

            {/* FREESHIP_THRESHOLD */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '16px', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                  <Percent size={16} style={{ color: 'var(--c-blue, #60a5fa)' }} />
                  Ngưỡng miễn phí vận chuyển (FREESHIP_THRESHOLD)
                </label>
                <div style={{ fontSize: '12px', color: 'var(--muted, #94a3b8)', marginTop: '2px' }}>
                  Đơn hàng có tổng tiền món đạt ngưỡng này sẽ được miễn phí tiền giao hàng
                </div>
              </div>
              <div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="10000"
                    min="0"
                    value={formSettings.FREESHIP_THRESHOLD || '300000'}
                    onChange={(e) => handleSettingChange('FREESHIP_THRESHOLD', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: '#34d399', textAlign: 'right', marginTop: '4px' }}>
                  {formatCurrency(formSettings.FREESHIP_THRESHOLD || 0)}
                </div>
              </div>
            </div>

            {/* MAX_ORDERS_PER_PACKAGE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '16px', alignItems: 'center', borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.06))', paddingTop: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                  <Package size={16} style={{ color: 'var(--c-amber, #fbbf24)' }} />
                  Số đơn tối đa / Gói hàng (MAX_ORDERS_PER_PACKAGE)
                </label>
                <div style={{ fontSize: '12px', color: 'var(--muted, #94a3b8)', marginTop: '2px' }}>
                  Số đơn hàng tối đa hệ thống tự động gom vào một gói để phân bổ cho shipper
                </div>
              </div>
              <input
                type="number"
                min="1"
                max="10"
                value={formSettings.MAX_ORDERS_PER_PACKAGE || '3'}
                onChange={(e) => handleSettingChange('MAX_ORDERS_PER_PACKAGE', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              />
            </div>

            {/* DEFAULT_SHIPPING_FEE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '16px', alignItems: 'center', borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.06))', paddingTop: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                  <Truck size={16} style={{ color: 'var(--c-green, #34d399)' }} />
                  Phí giao hàng mặc định (DEFAULT_SHIPPING_FEE)
                </label>
                <div style={{ fontSize: '12px', color: 'var(--muted, #94a3b8)', marginTop: '2px' }}>
                  Phí ship áp dụng khi phường/xã chưa được cấu hình giá riêng
                </div>
              </div>
              <div>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={formSettings.DEFAULT_SHIPPING_FEE || '20000'}
                  onChange={(e) => handleSettingChange('DEFAULT_SHIPPING_FEE', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                />
                <div style={{ fontSize: '12px', color: '#34d399', textAlign: 'right', marginTop: '4px' }}>
                  {formatCurrency(formSettings.DEFAULT_SHIPPING_FEE || 0)}
                </div>
              </div>
            </div>

            {/* ESTIMATED_DELIVERY_MINUTES */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '16px', alignItems: 'center', borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.06))', paddingTop: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                  <Clock size={16} style={{ color: '#a78bfa' }} />
                  Thời gian giao hàng dự kiến (phút)
                </label>
                <div style={{ fontSize: '12px', color: 'var(--muted, #94a3b8)', marginTop: '2px' }}>
                  Thời gian trung bình hiển thị cho khách từ lúc đặt đến khi nhận món
                </div>
              </div>
              <input
                type="number"
                min="10"
                max="120"
                value={formSettings.ESTIMATED_DELIVERY_MINUTES || '30'}
                onChange={(e) => handleSettingChange('ESTIMATED_DELIVERY_MINUTES', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              />
            </div>

            {/* STORE_HOTLINE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '16px', alignItems: 'center', borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.06))', paddingTop: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                  <PhoneCall size={16} style={{ color: '#f43f5e' }} />
                  Hotline hỗ trợ khách hàng
                </label>
                <div style={{ fontSize: '12px', color: 'var(--muted, #94a3b8)', marginTop: '2px' }}>
                  Số tổng đài hiển thị trên hóa đơn và chân trang
                </div>
              </div>
              <input
                type="text"
                value={formSettings.STORE_HOTLINE || '1900 6868'}
                onChange={(e) => handleSettingChange('STORE_HOTLINE', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              />
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SERVICE WARDS & SHIPPING FEES */}
      {activeTab === 'WARDS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filters Bar */}
          <div className="card card-p" style={{ padding: '16px 20px', backgroundColor: 'var(--surface-1, #1e2238)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
              {/* Search Ward */}
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted, #94a3b8)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Tìm theo tên phường/xã..."
                  value={wardKeyword}
                  onChange={(e) => {
                    setWardKeyword(e.target.value);
                    setWardPage(0);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 38px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* District Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--muted, #94a3b8)' }}>Quận/Huyện:</span>
                <select
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setWardPage(0);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1e2238',
                    border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                >
                  <option value="ALL" style={{ backgroundColor: '#1e2238', color: '#fff' }}>Tất cả quận/huyện</option>
                  {districts.map((d) => (
                    <option key={d} value={d} style={{ backgroundColor: '#1e2238', color: '#fff' }}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--muted, #94a3b8)' }}>Trạng thái:</span>
                <select
                  value={activeFilter}
                  onChange={(e) => {
                    setActiveFilter(e.target.value as any);
                    setWardPage(0);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1e2238',
                    border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                >
                  <option value="ALL" style={{ backgroundColor: '#1e2238', color: '#fff' }}>Tất cả</option>
                  <option value="ACTIVE" style={{ backgroundColor: '#1e2238', color: '#fff' }}>Đang phục vụ</option>
                  <option value="INACTIVE" style={{ backgroundColor: '#1e2238', color: '#fff' }}>Tạm dừng phục vụ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Wards Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {isLoadingWards ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted, #94a3b8)' }}>
                <Loader2 className="spin" size={32} style={{ margin: '0 auto 12px' }} />
                <div>Đang tải danh sách khu vực giao hàng...</div>
              </div>
            ) : wards.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted, #94a3b8)' }}>
                <MapPin size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <div style={{ fontSize: '15px', fontWeight: 500 }}>Không tìm thấy phường/xã nào</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.1))', color: 'var(--muted, #94a3b8)', background: 'rgba(255, 255, 255, 0.02)' }}>
                      <th style={{ padding: '14px 20px' }}>Phường / Xã</th>
                      <th style={{ padding: '14px 16px' }}>Quận / Huyện</th>
                      <th style={{ padding: '14px 16px' }}>Phí giao hàng</th>
                      <th style={{ padding: '14px 16px' }}>Trạng thái phục vụ</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wards.map((ward) => (
                      <tr
                        key={ward.id}
                        style={{
                          borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.06))',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px 20px', fontWeight: 600, color: '#fff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={16} style={{ color: 'var(--c-blue, #60a5fa)' }} />
                            <span>{ward.wardName}</span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                          {ward.district}
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#34d399' }}>
                          {formatCurrency(ward.shippingFee)}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 500,
                              backgroundColor: ward.isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: ward.isActive ? '#34d399' : '#f87171',
                            }}
                          >
                            <Power size={12} />
                            {ward.isActive ? 'Đang phục vụ' : 'Tạm dừng'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn btn-dark btn-sm"
                              onClick={() => setEditingWard(ward)}
                              title="Sửa mức phí"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              <DollarSign size={14} />
                              <span>Sửa phí</span>
                            </button>

                            <button
                              type="button"
                              className={ward.isActive ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
                              onClick={() => toggleWardMutation.mutate(ward.id)}
                              title={ward.isActive ? 'Tạm dừng phục vụ' : 'Mở phục vụ'}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                color: ward.isActive ? '#f87171' : '#fff',
                                borderColor: ward.isActive ? 'rgba(239, 68, 68, 0.3)' : undefined,
                              }}
                            >
                              {ward.isActive ? 'Tắt' : 'Bật'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalWardPages > 1 && (
              <div
                style={{
                  padding: '16px 20px',
                  borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  color: 'var(--muted, #94a3b8)',
                }}
              >
                <div>
                  Trang {wardPage + 1} / {totalWardPages} (Tổng {totalWards} phường/xã)
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-dark btn-sm"
                    disabled={wardPage === 0}
                    onClick={() => setWardPage((p) => Math.max(0, p - 1))}
                  >
                    Trước
                  </button>
                  <button
                    className="btn btn-dark btn-sm"
                    disabled={wardPage >= totalWardPages - 1}
                    onClick={() => setWardPage((p) => p + 1)}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Edit Shipping Fee Modal */}
          <EditShippingFeeModal
            isOpen={!!editingWard}
            ward={editingWard}
            onClose={() => setEditingWard(null)}
            onSave={(id, fee) => updateFeeMutation.mutate({ id, fee })}
            isSubmitting={updateFeeMutation.isPending}
          />
        </div>
      )}
    </div>
  );
};
