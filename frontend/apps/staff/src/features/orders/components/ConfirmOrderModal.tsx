import React, { useMemo, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { DeliveryPackage } from '../api/staffOrderApi';

interface ConfirmOrderModalProps {
  orderCode: string;
  openPackages: DeliveryPackage[];
  maxPerPackage?: number;
  externalError?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (pkgName: string, isNew: boolean) => void;
}

export const ConfirmOrderModal: React.FC<ConfirmOrderModalProps> = ({
  orderCode,
  openPackages,
  maxPerPackage = 7,
  externalError,
  isSubmitting = false,
  onClose,
  onConfirm,
}) => {
  const getPkgCapacity = (p: DeliveryPackage) => p.maxOrders || maxPerPackage;
  const getPkgCount = (p: DeliveryPackage) => p.currentOrdersCount ?? (p.orderCodes?.length || 0);

  const availablePackages = useMemo(
    () => openPackages.filter(p => getPkgCount(p) < getPkgCapacity(p)),
    [openPackages, maxPerPackage]
  );

  const [selectedPkg, setSelectedPkg] = useState<string>(
    availablePackages.length ? availablePackages[0].packageName : '__new__'
  );
  const [newPkgName, setNewPkgName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const displayError = error || externalError || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (selectedPkg === '__new__') {
      const trimmed = newPkgName.trim();
      if (!trimmed) {
        setError('Vui lòng nhập tên gói mới');
        return;
      }
      onConfirm(trimmed, true);
      return;
    }

    const pkg = openPackages.find(p => p.packageName === selectedPkg);
    if (!pkg) {
      setError('Gói không còn khả dụng');
      return;
    }
    if (getPkgCount(pkg) >= getPkgCapacity(pkg)) {
      setError(`Gói ${pkg.packageName} đã đầy (${getPkgCapacity(pkg)} đơn)`);
      return;
    }
    onConfirm(selectedPkg, false);
  };

  return (
    <div className="dlg-overlay" onClick={onClose}>
      <div className="dlg" onClick={(e) => e.stopPropagation()}>
        <div className="dlg-h">
          <h3>Xác nhận đơn {orderCode}</h3>
          <button className="ibtn" onClick={onClose} disabled={isSubmitting}><X size={20} /></button>
        </div>

        <form id="cf-f" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="dlg-b">
            <p className="muted" style={{ marginBottom: '16px' }}>
              Chọn một gói đang mở hoặc đặt tên cho gói mới. Một gói chứa tối đa {maxPerPackage} đơn, số lượng gói thì không giới hạn.
            </p>

            <div className="vlist">
              {openPackages.map(p => {
                const n = getPkgCount(p);
                const cap = getPkgCapacity(p);
                const full = n >= cap;
                return (
                  <label 
                    key={p.id || p.packageName} 
                    className="opt" 
                    style={{ opacity: full ? 0.5 : 1 }}
                  >
                    <input
                      type="radio"
                      name="pkg"
                      value={p.packageName}
                      checked={selectedPkg === p.packageName}
                      onChange={() => {
                        setSelectedPkg(p.packageName);
                        setError('');
                      }}
                      disabled={full || isSubmitting}
                    />
                    <span className="radio"></span>
                    <span className="grow">
                      <b>{p.packageName}</b><br/>
                      <span className="muted">{n}/{cap} đơn {full ? '· Đã đầy' : ''}</span>
                    </span>
                  </label>
                );
              })}
              <label className="opt">
                <input
                  type="radio"
                  name="pkg"
                  value="__new__"
                  checked={selectedPkg === '__new__'}
                  onChange={() => {
                    setSelectedPkg('__new__');
                    setError('');
                  }}
                  disabled={isSubmitting}
                />
                <span className="radio"></span>
                <span className="grow"><b>Tạo gói mới</b></span>
              </label>
            </div>

            <label className="field" style={{ marginTop: '12px' }}>
              <span>Tên gói mới</span>
              <input
                className="input"
                placeholder="Đặt tên gói, ví dụ GOI-E"
                value={newPkgName}
                onChange={e => { setNewPkgName(e.target.value); setError(''); }}
                disabled={selectedPkg !== '__new__' || isSubmitting}
              />
              {displayError && (
                <small style={{ color: 'var(--c-red)', marginTop: '4px', display: 'block' }}>
                  {displayError}
                </small>
              )}
            </label>
          </div>
          <div className="dlg-f">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đơn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
