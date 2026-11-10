import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Box, Clock, Eye, Info, Loader2, Package, Truck, User } from 'lucide-react';
import { staffOrderApi, type DeliveryPackage } from '@/features/orders/api/staffOrderApi';
import { PackageDetailModal } from '../components/PackageDetailModal';

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Đã xảy ra lỗi, vui lòng thử lại.';

export const PackagesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [detailPackageId, setDetailPackageId] = useState<number | null>(null);
  const [claimError, setClaimError] = useState('');

  const packagesQuery = useQuery({
    queryKey: ['open-packages'],
    queryFn: staffOrderApi.getOpenPackages,
    staleTime: 15_000,
  });
  const heldPackageQuery = useQuery({
    queryKey: ['my-held-package'],
    queryFn: staffOrderApi.getMyHeldPackage,
    staleTime: 15_000,
  });

  const claimMutation = useMutation({
    mutationFn: (packageId: number) => staffOrderApi.claimPackage(packageId),
    onSuccess: async () => {
      setClaimError('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['open-packages'] }),
        queryClient.invalidateQueries({ queryKey: ['my-held-package'] }),
      ]);
      navigate('/my-package');
    },
    onError: (error) => setClaimError(errorMessage(error)),
  });

  const packages = packagesQuery.data ?? [];
  const heldPackage = heldPackageQuery.data;

  const handleClaim = (pkg: DeliveryPackage) => {
    setClaimError('');
    claimMutation.mutate(pkg.id);
  };

  return (
    <>
      <div className="ah">
        <div>
          <h2>Gói hàng chờ giao</h2>
          <p>
            {packages.length} gói đang chờ nhận. Mỗi nhân viên chỉ giữ một gói tại một thời điểm.
          </p>
        </div>
      </div>

      {heldPackage && (
        <div className="card card-p" style={{ marginBottom: '20px', borderColor: 'var(--volt)' }}>
          <div className="row" style={{ gap: '12px' }}>
            <Info size={20} className="ic" style={{ color: 'var(--volt)' }} />
            <div>
              Bạn đang giao gói <b>{heldPackage.packageName}</b> <span className="muted">(#{heldPackage.id})</span>.
              {' '}<button className="tlink" type="button" onClick={() => navigate('/my-package')}>
                Xem gói đơn của tôi
              </button>
            </div>
          </div>
        </div>
      )}

      {claimError && (
        <div className="card card-p" role="alert" style={{ marginBottom: '16px', color: 'var(--c-red)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={18} /> {claimError}
        </div>
      )}

      {packagesQuery.isLoading ? (
        <div className="empty card" style={{ padding: '40px', textAlign: 'center' }}>
          <Loader2 size={22} className="animate-spin" />
          <p className="muted">Đang tải gói hàng…</p>
        </div>
      ) : packagesQuery.isError ? (
        <div className="empty card" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={24} style={{ color: 'var(--c-red)' }} />
          <h3>Không tải được gói hàng</h3>
          <p className="muted">{errorMessage(packagesQuery.error)}</p>
          <button className="btn btn-soft btn-sm" onClick={() => packagesQuery.refetch()}>Thử lại</button>
        </div>
      ) : (
        <div className="ban-g">
          {packages.length > 0 ? packages.map((pkg) => {
            const count = pkg.currentOrdersCount ?? pkg.orderCodes.length;
            const capacity = pkg.maxOrders || 7;
            const canClaim = !heldPackage && !heldPackageQuery.isLoading && !claimMutation.isPending;

            return (
              <article key={pkg.id} className="card card-p">
                <div className="row between" style={{ marginBottom: '10px' }}>
                  <div>
                    <b style={{ fontFamily: 'var(--f-display)', fontSize: '1.15rem' }}>{pkg.packageName}</b>
                    <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>Mã chuyến #{pkg.id}</div>
                  </div>
                  <span className="pill s-PENDING">Chờ nhận giao</span>
                </div>

                <div className="stack" style={{ gap: '8px', color: 'var(--ink-2)', fontSize: '14px' }}>
                  <span className="row"><Package size={16} /> {count}/{capacity} đơn</span>
                  {pkg.shippedByStaffName && (
                    <span className="row"><User size={16} /> {pkg.shippedByStaffName}</span>
                  )}
                  <span className="row"><Clock size={16} /> {formatDate(pkg.createdAt)}</span>
                </div>

                <div className="row wrap" style={{ marginTop: '16px', gap: '8px' }}>
                  <button className="btn btn-soft btn-sm" type="button" onClick={() => setDetailPackageId(pkg.id)}>
                    <Eye size={16} /> Chi tiết
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!canClaim}
                    onClick={() => handleClaim(pkg)}
                  >
                    {claimMutation.isPending && claimMutation.variables === pkg.id
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Truck size={16} />}
                    Nhận giao gói
                  </button>
                </div>
              </article>
            );
          }) : (
            <div className="empty card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
              <Box size={28} className="muted" />
              <h3>Không có gói nào đang chờ</h3>
              <p className="muted">Các gói chờ giao sẽ xuất hiện ở đây khi được tạo.</p>
            </div>
          )}
        </div>
      )}

      {detailPackageId !== null && (
        <PackageDetailModal
          pkgId={detailPackageId}
          packageName={packages.find((pkg) => pkg.id === detailPackageId)?.packageName}
          onClose={() => setDetailPackageId(null)}
        />
      )}
    </>
  );
};
