import React, { useState, useRef, useEffect } from 'react';
import type { TimeRange, RevenueChartData } from '../types';

interface RevenueChartProps {
  stats: Record<TimeRange, RevenueChartData>;
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

const usedNice = (x: number) => {
  const e = Math.pow(10, Math.floor(Math.log10(x > 0 ? x : 1)));
  const f = x / e;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e;
};

export const RevenueChart: React.FC<RevenueChartProps> = ({
  stats,
  selectedRange,
  onRangeChange,
}) => {
  const currentStat = stats[selectedRange];
  const vals = currentStat.values;
  const labels = currentStat.labels;
  const n = vals.length;
  const total = vals.reduce((a, b) => a + b, 0);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(480);
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    text: string;
    x: number;
    y: number;
  }>({ show: false, text: '', x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const W = Math.max(280, containerWidth);
  const H = Math.min(320, Math.max(220, W * 0.45));
  const pl = 38;
  const pr = 12;
  const pt = 14;
  const pb = 32;

  const maxVal = Math.max(...vals, 1);
  const step = usedNice(maxVal / 4);
  const top = step * Math.ceil(maxVal / step) || 1;

  const cw = (W - pl - pr) / n;
  const bw = Math.min(32, Math.max(12, cw * 0.6));
  const getY = (v: number) => pt + (H - pt - pb) * (1 - v / top);
  const every = Math.ceil((n * 44) / (W - pl));

  // Tạo các đường lưới ngang
  const gridLines: React.ReactNode[] = [];
  for (let v = 0; v <= top + 0.001; v += step) {
    const yPos = getY(v);
    gridLines.push(
      <g key={`grid-${v}`}>
        <line className="gl" x1={pl} x2={W - pr} y1={yPos} y2={yPos} stroke="var(--border)" strokeDasharray="3 3" />
        <text
          x={pl - 8}
          y={yPos + 4}
          textAnchor="end"
          fontSize="11"
          fill="var(--ink-3)"
        >
          {v}
        </text>
      </g>
    );
  }

  const rangeLabels: { key: TimeRange; label: string }[] = [
    { key: 'day', label: 'Ngày' },
    { key: 'week', label: 'Tuần' },
    { key: 'month', label: 'Tháng' },
  ];

  return (
    <section className="card card-p" aria-labelledby="h-rev">
      <div className="card-h">
        <div>
          <h3 id="h-rev">Doanh thu</h3>
          <div className="muted" style={{ fontSize: '13.5px', marginTop: '2px' }}>
            Tổng {currentStat.periodTotalText.toLowerCase()}:{' '}
            <b style={{ color: 'var(--ink)' }}>
              {String(Math.round(total * 10) / 10).replace('.', ',')} triệu ₫
            </b>
          </div>
        </div>
        <div className="seg" style={{ margin: 0 }} role="tablist">
          {rangeLabels.map(({ key, label }) => (
            <button
              key={key}
              className={`chip ${selectedRange === key ? 'on' : ''}`}
              style={{ minHeight: '34px', padding: '0 14px' }}
              role="tab"
              aria-selected={selectedRange === key}
              onClick={() => onRangeChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="chart"
        id="rev-chart"
        ref={containerRef}
        style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          role="group"
          aria-label="Biểu đồ doanh thu, đơn vị triệu đồng"
        >
          {gridLines}

          {vals.map((v, i) => {
            const x = pl + cw * i + (cw - bw) / 2;
            const y = getY(v);
            const height = H - pb - y;
            const isLatest = i === n - 1;
            const showLabel = i % every === 0 || i === n - 1;

            return (
              <g key={`bar-${i}`}>
                <rect
                  className={`bar-r ${isLatest ? 'hi' : ''}`}
                  x={x}
                  y={y}
                  width={bw}
                  height={Math.max(2, height)}
                  rx={Math.min(6, bw / 2)}
                  tabIndex={0}
                  role="img"
                  aria-label={`${labels[i]}: ${v} triệu đồng`}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const parentRect = containerRef.current?.getBoundingClientRect();
                    if (parentRect) {
                      setTooltip({
                        show: true,
                        text: `${labels[i]}: ${String(v).replace('.', ',')} triệu ₫`,
                        x: rect.left - parentRect.left + rect.width / 2,
                        y: rect.top - parentRect.top,
                      });
                    }
                  }}
                  onMouseLeave={() => setTooltip((prev) => ({ ...prev, show: false }))}
                />
                {showLabel && (
                  <text
                    x={x + bw / 2}
                    y={H - 8}
                    textAnchor="middle"
                    fontSize="11"
                    fill="var(--ink-3)"
                  >
                    {labels[i]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {tooltip.show && (
          <div
            className="tip on"
            style={{
              position: 'absolute',
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translate(-50%, -115%)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </section>
  );
};
