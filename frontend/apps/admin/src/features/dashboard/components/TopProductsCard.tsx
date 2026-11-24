import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils } from 'lucide-react';
import type { TopProductItem } from '../types';

interface TopProductsCardProps {
  products: TopProductItem[];
}

export const TopProductsCard: React.FC<TopProductsCardProps> = ({ products }) => {
  const maxSold = products.length > 0 ? Math.max(...products.map((product) => product.soldCount)) : 1;

  return (
    <section className="card card-p" aria-labelledby="h-top">
      <div className="card-h">
        <h3 id="h-top">Món bán chạy nhất</h3>
        <Link className="tlink" to="/admin/products">Xem tất cả</Link>
      </div>

      {products.length === 0 ? (
        <p className="muted">Chưa có dữ liệu món bán chạy trong kỳ này.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {products.map((product) => {
            const percent = Math.min(100, Math.round((product.soldCount / maxSold) * 100));
            return (
              <div className="hbar" key={product.id}>
                <div className="tile tile-xs" style={{
                  background: 'var(--surface-2)',
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '10px',
                  flexShrink: 0,
                }}>
                  <Utensils size={20} className="muted" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <b style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' }}>
                      {product.name}
                    </b>
                    {product.categoryName && (
                      <span className="muted" style={{ fontSize: '12px', marginLeft: '8px', flexShrink: 0 }}>
                        {product.categoryName}
                      </span>
                    )}
                  </div>
                  <div className="bar"><i style={{ width: `${percent}%` }} /></div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '8px' }}>
                  <span className="muted" style={{ fontWeight: 600, fontSize: '14px' }}>
                    {product.soldCount.toLocaleString('vi-VN')}
                  </span>
                  <div style={{ fontSize: '11px', color: 'var(--ink-3)' }}>đã bán</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
