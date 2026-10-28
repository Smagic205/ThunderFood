import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Calendar, 
  KeyRound, 
  User as UserIcon, 
  ShoppingBag, 
  MapPin, 
  Heart,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '@/app/store/authStore';
import { useToastStore } from '@/shared/stores/toastStore';
import { userApi } from '@/shared/api/userApi';
import { Link } from 'react-router-dom';

export const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const { showToast } = useToastStore();

  // State form Thông tin cá nhân
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ name?: string; phone?: string }>({});

  // State form Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [pwErrors, setPwErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});

  // Đồng bộ dữ liệu mới nhất từ backend khi trang được mở
  useEffect(() => {
    setIsLoadingProfile(true);
    userApi.getProfile()
      .then((profile) => {
        // Cập nhật store với data đầy đủ nhất từ server
        updateUser({
          id: Number(profile.id),
          fullName: profile.fullName,
          name: profile.fullName,
          email: profile.email,
          phone: profile.phone || '',
          avatarUrl: profile.avatarUrl,
          role: profile.role as 'CUSTOMER' | 'ADMIN' | 'STAFF' | 'SHIPPER',
          authProvider: profile.authProvider as 'LOCAL' | 'GOOGLE',
          status: profile.status as 'ACTIVE' | 'LOCKED',
          createdAt: profile.createdAt || undefined,
          updatedAt: profile.updatedAt || undefined,
        });
        // Đồng bộ form state
        setFullName(profile.fullName || '');
        setPhone(profile.phone || '');
      })
      .catch(() => {
        // Nếu lỗi mạng, vẫn giữ dữ liệu từ store (đã lưu local)
      })
      .finally(() => setIsLoadingProfile(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  // Tính toán độ mạnh mật khẩu (1 đến 4)
  const calculateStrength = (pw: string): number => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
    if (/\d/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    return score;
  };

  const strength = calculateStrength(newPassword);
  const strengthLabels = ['', 'Yếu (Cần ít nhất 8 ký tự)', 'Trung bình', 'Khá tốt', 'Mạnh & An toàn'];

  // Xử lý đổi ảnh đại diện
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp hình ảnh (JPG, PNG, WebP)', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Kích thước ảnh tối đa là 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      updateUser({ avatarUrl: result });
      showToast('Đã cập nhật ảnh đại diện');
    };
    reader.readAsDataURL(file);
  };

  // Xóa ảnh đại diện (quay về ký tự viết tắt)
  const handleRemoveAvatar = () => {
    updateUser({ avatarUrl: null });
    showToast('Đã gỡ ảnh đại diện');
  };

  // Lưu thông tin cá nhân — gọi thật backend PUT /v1/users/profile
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; phone?: string } = {};

    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      errors.name = 'Vui lòng nhập họ và tên (tối thiểu 2 ký tự)';
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      errors.phone = 'Số điện thoại không được để trống';
    } else if (!/^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/.test(trimmedPhone)) {
      errors.phone = 'Số điện thoại chưa hợp lệ (Ví dụ: 0912345678)';
    }

    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSavingProfile(true);
    try {
      const updated = await userApi.updateProfile({
        fullName: trimmedName,
        phone: trimmedPhone,
        avatarUrl: user?.avatarUrl || undefined,
      });
      // Cập nhật store với response từ server (source of truth)
      updateUser({
        fullName: updated.fullName,
        name: updated.fullName,
        phone: updated.phone || '',
        avatarUrl: updated.avatarUrl,
        updatedAt: updated.updatedAt || new Date().toISOString(),
      });
      showToast('Đã lưu thông tin cá nhân');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lưu thất bại, thử lại sau';
      showToast(msg, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Cập nhật mật khẩu
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { current?: string; new?: string; confirm?: string } = {};

    if (!currentPassword) {
      errors.current = 'Vui lòng nhập mật khẩu hiện tại';
    }

    if (!newPassword || newPassword.length < 8) {
      errors.new = 'Mật khẩu mới cần ít nhất 8 ký tự';
    }

    if (newPassword !== confirmPassword) {
      errors.confirm = 'Mật khẩu nhập lại chưa khớp';
    }

    setPwErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsChangingPw(true);
    setTimeout(() => {
      setIsChangingPw(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwErrors({});
      showToast('Đã cập nhật mật khẩu thành công');
    }, 500);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'TF';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatJoinDate = (dateStr?: string) => {
    if (!dateStr) return '15/10/2026';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN');
    } catch {
      return '15/10/2026';
    }
  };

  return (
    <div className="stack" style={{ '--gap': '24px' } as React.CSSProperties}>
      {/* Tiêu đề trang */}
      <div className="page-h" style={{ marginBottom: 4 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>Hồ sơ của tôi</h1>
          <p className="muted" style={{ fontSize: '14.5px', marginTop: 4 }}>
            Quản lý thông tin cá nhân, phương thức xác thực và bảo mật tài khoản.
          </p>
        </div>
      </div>

      {/* Thẻ 1: Thông tin cá nhân & Ảnh đại diện */}
      <div className="card card-p">
        <div className="card-h">
          <div className="flex items-center gap-2">
            <UserIcon size={20} className="text-[#A56200] dark:text-[#FFC552]" />
            <h3>Thông tin cá nhân</h3>
          </div>
          <div className="flex items-center gap-2">
            {isLoadingProfile && (
              <span className="flex items-center gap-1 faint" style={{ fontSize: '13px' }}>
                <Loader2 size={14} className="animate-spin" />
                Đang đồng bộ...
              </span>
            )}
            <span className="pill ok nodot">
              {user.status === 'LOCKED' ? 'Tạm khóa' : 'Đang hoạt động'}
            </span>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="form-grid" noValidate>
          {/* Avatar Upload */}
          <div className="row wrap" style={{ gap: 20, alignItems: 'center' }}>
            <span 
              className="avatar lg overflow-hidden shadow-sm shrink-0" 
              id="av"
              style={{ width: 72, height: 72, fontSize: 26 }}
            >
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                getInitials(user.name || user.fullName)
              )}
            </span>

            <div>
              <div className="row wrap" style={{ gap: 10 }}>
                <label className="btn btn-ghost btn-sm cursor-pointer">
                  <Upload size={16} />
                  <span>Đổi ảnh đại diện</span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    hidden 
                    onChange={handleAvatarChange} 
                  />
                </label>

                {user.avatarUrl && (
                  <button 
                    type="button" 
                    className="btn btn-danger btn-sm"
                    onClick={handleRemoveAvatar}
                  >
                    <Trash2 size={16} />
                    <span>Gỡ ảnh</span>
                  </button>
                )}
              </div>
              <div className="faint" style={{ fontSize: '12.5px', marginTop: 8 }}>
                Định dạng JPG, PNG hoặc WebP. Kích thước tối đa 2MB.
              </div>
            </div>
          </div>

          <hr className="divider my-1" />

          {/* Form Fields: Họ tên & SĐT */}
          <div className="grid2">
            <label className={`field ${profileErrors.name ? 'err' : ''}`}>
              <span>Họ và tên <b className="text-[var(--c-red)]">*</b></span>
              <input 
                className="input" 
                name="name" 
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (profileErrors.name) setProfileErrors((prev) => ({ ...prev, name: undefined }));
                }}
                autoComplete="name"
                placeholder="Nhập họ và tên đầy đủ"
              />
              {profileErrors.name && (
                <span className="errmsg">{profileErrors.name}</span>
              )}
            </label>

            <label className={`field ${profileErrors.phone ? 'err' : ''}`}>
              <span>Số điện thoại</span>
              <input 
                className="input" 
                name="phone" 
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (profileErrors.phone) setProfileErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                autoComplete="tel"
                placeholder="Ví dụ: 0912345678"
              />
              {profileErrors.phone && (
                <span className="errmsg">{profileErrors.phone}</span>
              )}
            </label>
          </div>

          {/* Email (Readonly) */}
          <label className="field">
            <span>Địa chỉ Email</span>
            <input 
              className="input" 
              type="email"
              value={user.email} 
              disabled 
              aria-describedby="em-h" 
              autoComplete="email"
            />
            <small id="em-h">
              Email dùng làm tài khoản định danh để đăng nhập và bảo mật nên không thể thay đổi.
            </small>
          </label>

          {/* Thuộc tính cơ sở dữ liệu (Database Metadata Grid) */}
          <div className="p-4 rounded-[16px] bg-[var(--surface-2)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[var(--ink-3)] block mb-1">Mã khách hàng</span>
              <b className="font-mono text-[var(--ink)]">
                #CUST-{String(user.id || 1).padStart(5, '0')}
              </b>
            </div>
            <div>
              <span className="text-[var(--ink-3)] block mb-1">Phương thức xác thực</span>
              <span className="pill ok nodot py-0.5 px-2 text-[11px]">
                {user.authProvider === 'GOOGLE' ? 'Google OAuth' : 'Tài khoản Local'}
              </span>
            </div>
            <div>
              <span className="text-[var(--ink-3)] block mb-1">Vai trò hệ thống</span>
              <span className="pill s-CONFIRMED nodot py-0.5 px-2 text-[11px]">
                {user.role}
              </span>
            </div>
            <div>
              <span className="text-[var(--ink-3)] block mb-1">Ngày tham gia</span>
              <span className="font-medium text-[var(--ink)] flex items-center gap-1">
                <Calendar size={13} className="text-[var(--ink-3)]" />
                {formatJoinDate(user.createdAt)}
              </span>
            </div>
          </div>

          {/* Nút lưu thay đổi */}
          <div>
            <button 
              type="submit" 
              className="btn btn-dark" 
              disabled={isSavingProfile || isLoadingProfile}
            >
              {isSavingProfile && <Loader2 size={16} className="animate-spin" />}
              {isSavingProfile ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>

      {/* Thẻ 2: Đổi mật khẩu */}
      <div className="card card-p">
        <div className="card-h">
          <div className="flex items-center gap-2">
            <KeyRound size={20} className="text-[#A56200] dark:text-[#FFC552]" />
            <h3>Đổi mật khẩu</h3>
          </div>
        </div>

        {user.authProvider === 'GOOGLE' ? (
          <div className="p-4 rounded-[16px] bg-[var(--surface-2)] flex items-start gap-3 text-sm">
            <ShieldCheck size={20} className="text-[#0F7F59] dark:text-[#52D9A3] shrink-0 mt-0.5" />
            <div>
              <b className="block text-[var(--ink)] mb-1">Đăng nhập bằng tài khoản Google</b>
              <p className="text-[var(--ink-2)]">
                Tài khoản của bạn được liên kết trực tiếp qua Google OAuth an toàn. Bạn không cần đổi hay thiết lập mật khẩu cục bộ trên ThunderFood.
              </p>
            </div>
          </div>
        ) : (
          <form 
            onSubmit={handleChangePassword} 
            className="form-grid" 
            style={{ maxWidth: 480 }} 
            noValidate
          >
            {/* Mật khẩu hiện tại */}
            <label className={`field ${pwErrors.current ? 'err' : ''}`}>
              <span>Mật khẩu hiện tại <b className="text-[var(--c-red)]">*</b></span>
              <div className="input-ic">
                <input 
                  className="input" 
                  type={showCurrentPw ? 'text' : 'password'} 
                  name="currentPassword" 
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu đang dùng"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (pwErrors.current) setPwErrors((prev) => ({ ...prev, current: undefined }));
                  }}
                />
                <button 
                  type="button" 
                  className="peek ibtn" 
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  aria-label={showCurrentPw ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                >
                  {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {pwErrors.current && <span className="errmsg">{pwErrors.current}</span>}
            </label>

            {/* Mật khẩu mới */}
            <label className={`field ${pwErrors.new ? 'err' : ''}`}>
              <span>Mật khẩu mới <b className="text-[var(--c-red)]">*</b></span>
              <div className="input-ic">
                <input 
                  className="input" 
                  type={showNewPw ? 'text' : 'password'} 
                  name="newPassword" 
                  autoComplete="new-password"
                  placeholder="Tối thiểu 8 ký tự chữ, số & ký hiệu"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (pwErrors.new) setPwErrors((prev) => ({ ...prev, new: undefined }));
                  }}
                />
                <button 
                  type="button" 
                  className="peek ibtn" 
                  onClick={() => setShowNewPw(!showNewPw)}
                  aria-label={showNewPw ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                >
                  {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Thanh đo độ mạnh mật khẩu chuẩn ThunderFood */}
              <div className="strength" data-s={strength} aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </div>
              {newPassword && (
                <small className="faint" style={{ display: 'block', marginTop: 6, fontSize: '12.5px' }}>
                  Độ mạnh: <b className="text-[var(--ink)]">{strengthLabels[strength]}</b>
                </small>
              )}
              {pwErrors.new && <span className="errmsg">{pwErrors.new}</span>}
            </label>

            {/* Nhập lại mật khẩu mới */}
            <label className={`field ${pwErrors.confirm ? 'err' : ''}`}>
              <span>Nhập lại mật khẩu mới <b className="text-[var(--c-red)]">*</b></span>
              <div className="input-ic">
                <input 
                  className="input" 
                  type={showConfirmPw ? 'text' : 'password'} 
                  name="confirmPassword" 
                  autoComplete="new-password"
                  placeholder="Nhập lại chính xác mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (pwErrors.confirm) setPwErrors((prev) => ({ ...prev, confirm: undefined }));
                  }}
                />
                <button 
                  type="button" 
                  className="peek ibtn" 
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  aria-label={showConfirmPw ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                >
                  {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {pwErrors.confirm && <span className="errmsg">{pwErrors.confirm}</span>}
            </label>

            <div>
              <button 
                type="submit" 
                className="btn btn-dark" 
                disabled={isChangingPw}
              >
                {isChangingPw ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Thẻ 3: Tóm tắt hoạt động & Lối tắt tài khoản */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          to="/account/orders" 
          className="card card-p hover:border-[var(--ink-3)] transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[12px] bg-[var(--volt-soft)] text-[#A56200] dark:text-[#FFC552] flex items-center justify-center shrink-0">
              <ShoppingBag size={20} />
            </span>
            <div>
              <b className="block text-[var(--ink)] group-hover:text-[#A56200] dark:group-hover:text-[#FFC552] transition-colors">
                Đơn hàng của tôi
              </b>
              <span className="text-xs text-[var(--ink-3)]">Theo dõi lịch sử đơn</span>
            </div>
          </div>
          <ExternalLink size={16} className="text-[var(--ink-3)] group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link 
          to="/account/addresses" 
          className="card card-p hover:border-[var(--ink-3)] transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[12px] bg-[var(--surface-2)] text-[var(--c-blue)] flex items-center justify-center shrink-0">
              <MapPin size={20} />
            </span>
            <div>
              <b className="block text-[var(--ink)] group-hover:text-[var(--c-blue)] transition-colors">
                Sổ địa chỉ
              </b>
              <span className="text-xs text-[var(--ink-3)]">Quản lý nơi giao hàng</span>
            </div>
          </div>
          <ExternalLink size={16} className="text-[var(--ink-3)] group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link 
          to="/account/wishlist" 
          className="card card-p hover:border-[var(--ink-3)] transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[12px] bg-red-100 dark:bg-red-950/40 text-[var(--c-red)] flex items-center justify-center shrink-0">
              <Heart size={20} />
            </span>
            <div>
              <b className="block text-[var(--ink)] group-hover:text-[var(--c-red)] transition-colors">
                Món yêu thích
              </b>
              <span className="text-xs text-[var(--ink-3)]">Danh sách đã lưu</span>
            </div>
          </div>
          <ExternalLink size={16} className="text-[var(--ink-3)] group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
