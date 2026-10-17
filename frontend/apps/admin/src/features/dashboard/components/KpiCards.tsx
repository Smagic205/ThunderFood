import React from 'react';
import { Wallet, Receipt, Clock, Users, TrendingUp, TrendingDown } from 'lucide-react';
import type { KpiMetric } from '../types';

interface KpiCardsProps {
  revenueToday: KpiMetric;
  ordersToday: KpiMetric;
  processingOrders: KpiMetric;
  newCustomersWeek: KpiMetric;
}

const renderSparkline = (arr: number[], color: string) => {
  if (!arr || arr.length < 2) return null;
  const w = 120;
  const h = 36;
  const mx = Math.max(...arr);
  const mn = Math.min(...arr);
  const range = mx - mn || 1;

  const pts = arr.map((v, i) => {
    const x = i * (w / (arr.length - 1));
    const y = h - 4 - ((v - mn) / range) * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <path
        d={`M${pts.join(' L')}`}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

export const KpiCards: React.FC<KpiCardsProps> = ({
  revenueToday,
  ordersToday,
  processingOrders,
  newCustomersWeek,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'wallet':
        return <Wallet size={22} />;
      case 'receipt':
        return <Receipt size={22} />;
      case 'clock':
        return <Clock size={22} />;
      case 'users':
        return <Users size={22} />;
      default:
        return <Wallet size={22} />;
    }
  };

  const cards: KpiMetric[] = [
    revenueToday,
    ordersToday,
    processingOrders,
    newCustomersWeek,
  ];

  return (
    <div className="kpis">
      {cards.map((card, idx) => {
        const strokeColor = card.isPositive ? 'var(--c-green)' : 'var(--c-red)';
        return (
          <div className="card kpi" key={idx}>
            <div className="k-top">
              <span>{card.label}</span>
              <span className="k-ic">{getIcon(card.icon)}</span>
            </div>
            <div className="k-val">{card.value}</div>
            <span className={`delta ${card.isPositive ? '' : 'down'}`}>
              {card.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {card.deltaText} so với hôm qua
            </span>
            {renderSparkline(card.sparkline, strokeColor)}
          </div>
        );
      })}
    </div>
  );
};
