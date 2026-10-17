import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Box,
  User,
  Eye,
  Clock,
} from 'lucide-react';
import { packagesApi } from '../api/packagesApi';
import { PackageDetailModal } from '../components/PackageDetailModal';
import type { DeliveryPackage, PackageFilterTab, PackageStatus } from '../types';

export const PackagesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PackageFilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<DeliveryPackage | null>(null);

  // Fetch packages
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['admin-packages'],
    queryFn: packagesApi.getPackages,
  });

  // URL query param ?open=GOI-X
  const openParam = searchParams.get('open');
  useEffect(() => {
    if (openParam && packages.length > 0) {
      const match = packages.find(
        (p) => p.code.toLowerCase() === openParam.toLowerCase()
      );
      if (match) {
        setSelectedPackage(match);
      }
    }
  }, [openParam, packages]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: packages.length,
      UNASSIGNED: 0,
      DELIVERING: 0,
      COMPLETED: 0,
    };
    packages.forEach((p) => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      }
    });
    return counts;
  }, [packages]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return packages.filter((p) => {
      const matchesTab = activeTab === 'ALL' || p.status === activeTab;
      const matchesSearch =
        !q ||
        p.code.toLowerCase().includes(q) ||
        (p.staffName && p.staffName.toLowerCase().includes(q)) ||
        p.orderCodes.some((code) => code.toLowerCase().includes(q));
      return matchesTab && matchesSearch;
    });
  }, [packages, activeTab, searchQuery]);

  const handleCloseModal = () => {
    setSelectedPackage(null);
    if (searchParams.has('open')) {
      searchParams.delete('open');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const getPackageStatusBadge = (status: PackageStatus) => {
    switch (status) {
      case 'UNASSIGNED':
        return <span className="pill p-amber">Chưa giao</span>;
      case 'DELIVERING':
        return <span className="pill p-teal">Đang giao</span>;
      case 'COMPLETED':
        return <span className="pill p-green">Hoàn thành</span>;
      default:
        return <span className="pill">{status}</span>;
    }
  };

  const tabsConfig: { key: PackageFilterTab; label: string }[] = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'UNASSIGNED', label: 'Chưa giao' },
    { key: 'DELIVERING', label: 'Đang giao' },
    { key: 'COMPLETED', label: 'Hoàn thành' },
  ];

  return (
    <div>
      {/* Page Header (ahead) */}
      <div className="ah">
        <div>
          <h2>Gói hàng</h2>
          <p>
            {tabCounts.UNASSIGNED || 0} gói chưa giao, {tabCounts.DELIVERING || 0} gói đang giao. Admin chỉ theo dõi, việc nhận và giao gói do nhân viên thực hiện.
          </p>
        </div>
      </div>

      {/* Main Panel */}
      <div className="card panel-t">
        {/* Status Filter Tabs (seg / chip) */}
        <div className="seg" role="tablist">
          {tabsConfig.map((t) => {
            const isSelected = activeTab === t.key;
            return (
              <button
                key={t.key}
                className={`chip ${isSelected ? 'on' : ''}`}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                <span className="n">{tabCounts[t.key] || 0}</span>
              </button>
            );
          })}
        </div>

        {/* Filter / Search Bar */}
        <div className="filters-bar" style={{ padding: '16px' }}>
          <div className="input-ic" style={{ width: '100%', maxWidth: '420px' }}>
            <Search size={18} className="muted" />
            <input
              className="input"
              type="search"
              placeholder="Tìm mã gói, nhân viên, mã đơn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm gói hàng"
            />
          </div>
        </div>

        {/* Packages Grid */}
        <div style={{ padding: '20px' }}>
          {isLoading ? (
            <div className="empty" style={{ padding: '40px' }}>
              <p className="muted">Đang tải danh sách gói hàng…</p>
            </div>
          ) : filteredPackages.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '18px',
              }}
            >
              {filteredPackages.map((pkg) => {
                const percent = Math.min(100, Math.round((pkg.orders.length / 7) * 100));
                return (
                  <article
                    key={pkg.id}
                    className="card card-p"
                    style={{
                      backgroundColor: 'var(--surface-2, rgba(255, 255, 255, 0.04))',
                      borderRadius: '16px',
                      border: '1px solid var(--line, rgba(255, 255, 255, 0.07))',
                      boxShadow: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    <div>
                      {/* Card Header */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        <b
                          style={{
                            fontFamily: 'var(--f-display)',
                            fontSize: '1.25rem',
                            color: 'var(--ink)',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {pkg.code}
                        </b>
                        {getPackageStatusBadge(pkg.status)}
                      </div>

                      {/* Info Meta */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          color: 'var(--ink-2, #B9C0EA)',
                          fontSize: '13.5px',
                          marginBottom: '14px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Box size={16} className="muted" />
                          <span>
                            Dung lượng: <b>{pkg.orders.length}/7 đơn</b>
                          </span>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '99px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${percent}%`,
                              height: '100%',
                              backgroundColor:
                                pkg.orders.length >= 7
                                  ? 'var(--c-red, #ef4444)'
                                  : pkg.orders.length >= 5
                                  ? 'var(--c-amber, #f59e0b)'
                                  : 'var(--c-green, #10b981)',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <User size={16} className="muted" />
                          <span>
                            {pkg.staffName ? (
                              <span style={{ color: 'var(--ink)' }}>Shipper: <b>{pkg.staffName}</b></span>
                            ) : (
                              <span className="muted" style={{ fontStyle: 'italic' }}>Chưa có người nhận</span>
                            )}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={16} className="muted" />
                          <span className="muted" style={{ fontSize: '12.5px' }}>
                            Khởi tạo: {pkg.createdAt}
                          </span>
                        </div>
                      </div>

                      {/* Orders Preview Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                        {pkg.orderCodes.map((code) => (
                          <span
                            key={code}
                            className="tag"
                            style={{
                              fontSize: '11.5px',
                              padding: '2px 8px',
                              backgroundColor: 'rgba(255,255,255,0.06)',
                            }}
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      className="btn btn-soft btn-sm"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <Eye size={16} />
                      Chi tiết gói hàng
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty" style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 14px',
                  color: 'var(--c-amber, #f59e0b)',
                }}
              >
                <Box size={28} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Không tìm thấy gói hàng</h3>
              <p className="muted" style={{ fontSize: '13.5px' }}>
                Thử đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Package Detail Modal */}
      <PackageDetailModal
        pkg={selectedPackage}
        onClose={handleCloseModal}
        onOpenOrder={(orderCode) => {
          handleCloseModal();
          navigate(`/admin/orders?open=${orderCode}`);
        }}
      />
    </div>
  );
};
