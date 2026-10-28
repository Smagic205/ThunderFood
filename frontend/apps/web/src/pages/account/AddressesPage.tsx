import { useMemo, useState, type FormEvent } from 'react';
import { MapPin, Plus, Star, Trash2, Pencil, X, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addressApi, type AddressPayload, type CustomerAddress } from '@/shared/api/addressApi';
import { useAuthStore } from '@/app/store/authStore';
import { useToastStore } from '@/shared/stores/toastStore';

interface AddressFormState {
  receiverName: string;
  phone: string;
  wardId: string;
  detailAddress: string;
  isDefault: boolean;
}

const emptyForm = (receiverName = '', phone = ''): AddressFormState => ({
  receiverName,
  phone,
  wardId: '',
  detailAddress: '',
  isDefault: false,
});

const normalizeText = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('vi');

export const AddressesPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [form, setForm] = useState<AddressFormState>(() => emptyForm(
    user?.fullName || user?.name || '',
    user?.phone || '',
  ));
  const [wardSearch, setWardSearch] = useState('');

  const addressesQuery = useQuery({
    queryKey: ['my-addresses'],
    queryFn: addressApi.getMyAddresses,
  });
  const wardsQuery = useQuery({
    queryKey: ['service-wards'],
    queryFn: addressApi.getServiceWards,
    staleTime: 5 * 60 * 1000,
  });

  const addresses = addressesQuery.data ?? [];
  const wards = wardsQuery.data ?? [];
  const visibleWards = useMemo(() => {
    const query = normalizeText(wardSearch.trim());
    if (!query) return wards;
    return wards.filter((ward) => normalizeText(`${ward.displayName} ${ward.wardName}`).includes(query));
  }, [wardSearch, wards]);
  const selectedWard = wards.find((ward) => String(ward.id) === form.wardId);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingAddress(null);
    setWardSearch('');
  };

  const openCreateForm = () => {
    setEditingAddress(null);
    setForm(emptyForm(user?.fullName || user?.name || '', user?.phone || ''));
    setWardSearch('');
    setIsFormOpen(true);
  };

  const openEditForm = (address: CustomerAddress) => {
    setEditingAddress(address);
    setForm({
      receiverName: address.receiverName,
      phone: address.phone,
      wardId: String(address.ward.id),
      detailAddress: address.detailAddress,
      isDefault: Boolean(address.isDefault),
    });
    setWardSearch('');
    setIsFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (payload: AddressPayload) => editingAddress
      ? addressApi.update(editingAddress.id, payload)
      : addressApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      showToast(editingAddress ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ');
      closeForm();
    },
    onError: (error) => showToast(error.message || 'Không thể lưu địa chỉ', 'error'),
  });

  const defaultMutation = useMutation({
    mutationFn: addressApi.setDefault,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      showToast('Đã đặt địa chỉ mặc định');
    },
    onError: (error) => showToast(error.message || 'Không thể đặt địa chỉ mặc định', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: addressApi.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      showToast('Đã xóa địa chỉ');
    },
    onError: (error) => showToast(error.message || 'Không thể xóa địa chỉ', 'error'),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.wardId) {
      showToast('Vui lòng chọn phường/xã giao hàng', 'error');
      return;
    }

    saveMutation.mutate({
      detailAddress: form.detailAddress.trim(),
      wardId: Number(form.wardId),
      receiverName: form.receiverName.trim(),
      phone: form.phone.trim(),
      isDefault: form.isDefault,
    });
  };

  const handleDelete = (address: CustomerAddress) => {
    if (window.confirm(`Xóa địa chỉ “${address.fullAddress}”?`)) {
      deleteMutation.mutate(address.id);
    }
  };

  return (
    <div>
      <div className="page-h" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>Địa chỉ giao hàng</h1>
          <p className="muted" style={{ fontSize: 14.5, marginTop: 4 }}>
            Chọn phường/xã trong khu vực đang phục vụ và quản lý địa chỉ nhận hàng.
          </p>
        </div>
        {!isFormOpen && (
          <button className="btn btn-primary" type="button" onClick={openCreateForm}>
            <Plus size={18} />
            <span>Thêm địa chỉ</span>
          </button>
        )}
      </div>

      {isFormOpen && (
        <section className="card p-5 md:p-6 mb-6" aria-labelledby="address-form-title">
          <div className="row between" style={{ marginBottom: 18 }}>
            <h2 id="address-form-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              {editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </h2>
            <button className="ibtn" type="button" aria-label="Đóng biểu mẫu" onClick={closeForm}>
              <X size={20} />
            </button>
          </div>

          {wardsQuery.isError ? (
            <div className="empty" role="alert" style={{ padding: 20 }}>
              Không tải được danh sách phường/xã. Vui lòng thử tải lại trang.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <label className="field">
                <span>Người nhận</span>
                <input
                  className="input"
                  value={form.receiverName}
                  onChange={(event) => setForm((current) => ({ ...current, receiverName: event.target.value }))}
                  maxLength={150}
                  required
                />
              </label>
              <label className="field">
                <span>Số điện thoại</span>
                <input
                  className="input"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="0987654321"
                  required
                />
              </label>
              <label className="field md:col-span-2">
                <span>Tìm phường/xã</span>
                <input
                  className="input"
                  value={wardSearch}
                  onChange={(event) => setWardSearch(event.target.value)}
                  placeholder="Nhập tên phường hoặc xã"
                />
              </label>
              <label className="field md:col-span-2">
                <span>Phường/xã giao hàng</span>
                <select
                  className="input"
                  value={form.wardId}
                  onChange={(event) => setForm((current) => ({ ...current, wardId: event.target.value }))}
                  required
                  disabled={wardsQuery.isPending || visibleWards.length === 0}
                >
                  <option value="">{wardsQuery.isPending ? 'Đang tải phường/xã…' : 'Chọn phường/xã'}</option>
                  {visibleWards.map((ward) => (
                    <option key={ward.id} value={ward.id}>{ward.displayName}</option>
                  ))}
                </select>
                {selectedWard && (
                  <small className="muted">
                    Phí giao hàng khu vực này: {selectedWard.shippingFee.toLocaleString('vi-VN')}₫
                  </small>
                )}
                {!wardsQuery.isPending && visibleWards.length === 0 && (
                  <small className="muted">Không tìm thấy phường/xã phù hợp.</small>
                )}
              </label>
              <label className="field md:col-span-2">
                <span>Địa chỉ chi tiết</span>
                <textarea
                  className="input"
                  rows={3}
                  value={form.detailAddress}
                  onChange={(event) => setForm((current) => ({ ...current, detailAddress: event.target.value }))}
                  placeholder="Số nhà, ngõ, tên đường…"
                  maxLength={500}
                  required
                />
              </label>
              {editingAddress?.isDefault ? (
                <p className="muted md:col-span-2">Đây đang là địa chỉ mặc định của bạn.</p>
              ) : (
                <label className="check md:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(event) => setForm((current) => ({ ...current, isDefault: event.target.checked }))}
                  />
                  Đặt làm địa chỉ mặc định
                </label>
              )}
              <div className="row md:col-span-2" style={{ justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn btn-ghost" type="button" onClick={closeForm}>Hủy</button>
                <button className="btn btn-primary" type="submit" disabled={saveMutation.isPending || wardsQuery.isPending}>
                  {saveMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  {editingAddress ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {addressesQuery.isPending ? (
        <div className="empty card" role="status">Đang tải địa chỉ…</div>
      ) : addressesQuery.isError ? (
        <div className="empty card" role="alert">
          <h3>Không tải được địa chỉ</h3>
          <p>{addressesQuery.error.message}</p>
          <button className="btn btn-ghost mt-3" type="button" onClick={() => void addressesQuery.refetch()}>
            Thử lại
          </button>
        </div>
      ) : addresses.length === 0 ? (
        <div className="empty card">
          <div className="art-wrap text-[var(--c-amber)] bg-[var(--volt-soft)]"><MapPin size={48} /></div>
          <h3>Chưa có địa chỉ nào</h3>
          <p>Thêm địa chỉ giao hàng để ThunderFood phục vụ bạn nhanh hơn.</p>
          {!isFormOpen && (
            <button className="btn btn-primary mt-2" type="button" onClick={openCreateForm}>
              <Plus size={18} />
              <span>Thêm địa chỉ mới</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <article key={address.id} className="card p-5 md:p-6">
              <div className="row between wrap" style={{ gap: 14, alignItems: 'flex-start' }}>
                <div className="min-w-0">
                  <div className="row wrap" style={{ gap: 8, marginBottom: 8 }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{address.receiverName}</h2>
                    {address.isDefault && <span className="tag gold">Mặc định</span>}
                  </div>
                  <p className="muted" style={{ marginBottom: 6 }}>{address.phone}</p>
                  <p>{address.fullAddress}</p>
                  <small className="muted">
                    Phí giao hàng: {Number(address.ward.shippingFee).toLocaleString('vi-VN')}₫
                  </small>
                </div>
                <div className="row wrap" style={{ gap: 8 }}>
                  {!address.isDefault && (
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => defaultMutation.mutate(address.id)}
                      disabled={defaultMutation.isPending}
                    >
                      <Star size={15} /> Đặt mặc định
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => openEditForm(address)}>
                    <Pencil size={15} /> Sửa
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => handleDelete(address)}
                    disabled={deleteMutation.isPending}
                    aria-label={`Xóa địa chỉ của ${address.receiverName}`}
                  >
                    <Trash2 size={15} /> Xóa
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
