import React from 'react';
import type { StatusCountItem } from '../types';

interface OrderStatusDonutProps {
  items: StatusCountItem[];
}

export const OrderStatusDonut: React.FC<OrderStatusDonutProps> = ({ items }) => {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const R = 62;
  const C = 2 * Math.PI * R;

  let currentOffset = 0;
  const segments = items
    .filter((item) => item.count > 0)
    .map((item) => {
      const len = total > 0 ? (item.count / total) * C : 0;
      const strokeDasharray = `${Math.max(0, len - 3)} ${C}`;
      const strokeDashoffset = -currentOffset;
      currentOffset += len;

      return (
        <circle
          key={item.status}
          r={R}
          cx="80"
          cy="80"
          fill="none"
          stroke={item.color}
          strokeWidth="22"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
      );
    });

  return (
    <section className="card card-p" aria-labelledby="h-dn">
      <div className="card-h">
        <h3 id="h-dn">Đơn theo trạng thái</h3>
      </div>
      <div className="donut-wrap">
        <svg
          className="donut"
          viewBox="0 0 160 160"
          role="img"
          aria-label="Tỷ lệ đơn hàng theo trạng thái"
        >
          {/* Vòng nền mờ phía sau */}
          <circle
            r={R}
            cx="80"
            cy="80"
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth="22"
          />
          {segments}
          <text
            x="80"
            y="82"
            textAnchor="middle"
            style={{
              fontFamily: 'var(--f-display)',
              fontWeight: 800,
              fontSize: '28px',
              fill: 'var(--ink)',
            }}
          >
            {total}
          </text>
          <text
            x="80"
            y="100"
            textAnchor="middle"
            style={{
              fontFamily: 'var(--f-body)',
              fontWeight: 500,
              fontSize: '11px',
              fill: 'var(--ink-3)',
            }}
          >
            đơn hàng
          </text>
        </svg>

        <div className="legend">
          {items.map((item) => (
            <div key={item.status}>
              <i style={{ background: item.color }} />
              {item.label}
              <b>{item.count}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
