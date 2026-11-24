import React from 'react';
import { Wallet, Receipt, Clock, Users } from 'lucide-react';
import type { KpiMetric } from '../types';

interface KpiCardsProps {
  revenueToday: KpiMetric;
  ordersToday: KpiMetric;
  processingOrders: KpiMetric;
  newCustomersWeek: KpiMetric;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  revenueToday,
  ordersToday,
  processingOrders,
  newCustomersWeek,
}) => {
  const getIcon = (type: KpiMetric['icon']) => {
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

  const cards = [revenueToday, ordersToday, processingOrders, newCustomersWeek];

  return (
    <div className="kpis">
      {cards.map((card) => (
        <div className="card kpi" key={card.icon}>
          <div className="k-top">
            <span>{card.label}</span>
            <span className="k-ic">{getIcon(card.icon)}</span>
          </div>
          <div className="k-val">{card.value}</div>
          <span className="delta">{card.detail}</span>
        </div>
      ))}
    </div>
  );
};
