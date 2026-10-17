import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';

interface ConfirmOrderModalProps {
  orderCode: string;
  openPackages: { code: string; order_codes: string[] }[];
  maxPerPackage: number;
  externalError?: string;
  onClose: () => void;
  onConfirm: (pkgCode: string, isNew: boolean) => void;
}

export const ConfirmOrderModal: React.FC<ConfirmOrderModalProps> = ({
  orderCode,
  openPackages,
  maxPerPackage,
  externalError,
  onClose,
  onConfirm,
}) => {
  const availablePackages = useMemo(
    () => openPackages.filter(p => (p.order_codes?.length || 0) < maxPerPackage),
    [openPackages, maxPerPackage]
  );

  const [selectedPkg, setSelectedPkg] = useState<string>(
    availablePackages.length ? availablePackages[0].code : '__new__'
  );
  const [newPkgName, setNewPkgName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const displayError = error || externalError || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPkg === '__new__') {
      if (!newPkgName.trim()) {
        setError('Vui lòng nhập tên gói mới');
        return;
      }
      onConfirm(newPkgName.trim(), true);
      return;
    }

    const pkg = openPackages.find(p => p.code === selectedPkg);
    if (!pkg) {
      setError('Gói không còn khả dụng');
      return;
    }
    if ((pkg.order_codes?.length || 0) >= maxPerPackage) {
      setError(`Gói ${pkg.code} đã đầy (${maxPerPackage} đơn)`);
      return;
    }
    onConfirm(selectedPkg, false);
  };

  return (
    <div className="dlg-overlay" onClick={onClose}>
      <div className="dlg" onClick={(e) => e.stopPropagation()}>
        <div className="dlg-h">
          <h3>Xác nhận đơn {orderCode}</h3>
          <button className="ibtn" onClick={onClose}><X size={20} /></button>
        </div>

        <form id="cf-f" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="dlg-b">
            <p className="muted" style={{ marginBottom: '16px' }}>
              Chọn một gói đang mở hoặc đặt tên cho gói mới. Một gói chứa tối đa {maxPerPackage} đơn, số lượng gói thì không giới hạn.
            </p>

            <div className="vlist">
              {openPackages.map(p => {
                const n = p.order_codes?.length || 0;
                const full = n >= maxPerPackage;
                return (
                  <label 
                    key={p.code} 
                    className="opt" 
                    style={{ opacity: full ? 0.5 : 1 }}
                  >
                    <input
                      type="radio"
                      name="pkg"
                      value={p.code}
                      checked={selectedPkg === p.code}
                      onChange={() => {
                        setSelectedPkg(p.code);
                        setError('');
                      }}
                      disabled={full}
                    />
                    <span className="radio"></span>
                    <span className="grow">
                      <b>{p.code}</b><br/>
                      <span className="muted">{n}/{maxPerPackage} đơn {full ? '· Đã đầy' : ''}</span>
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
                disabled={selectedPkg !== '__new__'}
              />
              {displayError && (
                <small style={{ color: 'var(--c-red)', marginTop: '4px', display: 'block' }}>
                  {displayError}
                </small>
              )}
            </label>
          </div>
          <div className="dlg-f">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary">Xác nhận đơn</button>
          </div>
        </form>
      </div>
    </div>
  );
};
