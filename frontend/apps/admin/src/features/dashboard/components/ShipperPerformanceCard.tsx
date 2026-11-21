import React from 'react';
import { Truck, Clock, Award } from 'lucide-react';
import type { ShipperPerformanceItem } from '../types';

interface ShipperPerformanceCardProps {
  shippers?: ShipperPerformanceItem[];
}

export const ShipperPerformanceCard: React.FC<ShipperPerformanceCardProps> = ({ shippers = [] }) => {
  if (shippers.length === 0) return null;

  return (
    <div className="card card-p" style={{ backgroundColor: 'var(--surface-1, #1e2238)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--c-blue, #60a5fa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Truck size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>
              Hiệu suất giao hàng của nhân viên / Shipper
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--muted, #94a3b8)' }}>
              Theo dõi số gói hàng, tỷ lệ thành công và thời gian giao hàng thực tế
            </span>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.08))', color: 'var(--muted, #94a3b8)' }}>
              <th style={{ padding: '10px 14px' }}>Nhân viên</th>
              <th style={{ padding: '10px 14px' }}>Liên hệ</th>
              <th style={{ padding: '10px 14px', textAlign: 'center' }}>Số gói nhận</th>
              <th style={{ padding: '10px 14px', textAlign: 'center' }}>Đơn thành công</th>
              <th style={{ padding: '10px 14px', textAlign: 'center' }}>Tỷ lệ hoàn thành</th>
              <th style={{ padding: '10px 14px', textAlign: 'center' }}>Thời gian TB</th>
            </tr>
          </thead>
          <tbody>
            {shippers.map((s) => (
              <tr
                key={s.staffId}
                style={{
                  borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.04))',
                }}
              >
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        color: 'var(--c-blue, #60a5fa)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {s.staffName ? s.staffName.slice(0, 2).toUpperCase() : 'SH'}
                    </div>
                    <span>{s.staffName}</span>
                  </div>
                </td>

                <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                  <div>{s.email}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted, #94a3b8)' }}>{s.phone}</div>
                </td>

                <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#e2e8f0' }}>
                  {s.totalPackages} gói ({s.totalOrders} đơn)
                </td>

                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>{s.deliveredOrders}</span>
                  {s.failedOrders > 0 && (
                    <span style={{ color: '#f87171', fontSize: '11px', marginLeft: '6px' }}>
                      ({s.failedOrders} lỗi)
                    </span>
                  )}
                </td>

                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: s.successRate >= 90 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: s.successRate >= 90 ? '#34d399' : '#fbbf24',
                    }}
                  >
                    <Award size={11} />
                    {s.successRate.toFixed(1)}%
                  </span>
                </td>

                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#cbd5e1' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} style={{ color: 'var(--muted, #94a3b8)' }} />
                    <span>{s.avgDeliveryMinutes ? `${Math.round(s.avgDeliveryMinutes)} phút` : '--'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
