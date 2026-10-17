import { create } from 'zustand';
import { MOCK_ORDERS, MOCK_PACKAGES } from './mockData';

const MAX_PER_PACKAGE = 7;

type Order = (typeof MOCK_ORDERS)[number];
type Package = (typeof MOCK_PACKAGES)[number];

interface OrderState {
  orders: Order[];
  packages: Package[];
  maxPerPackage: number;
  cancelOrder: (code: string) => void;
  confirmOrder: (orderCode: string, pkgCode: string, isNew: boolean) => string | null;
  claimPackage: (pkgId: number, staffId: number) => string | null;
  updateOrderStatus: (orderCode: string, newStatus: string, staffId?: number) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: MOCK_ORDERS.map(o => ({ ...o, history: [...o.history], items: [...o.items] })),
  packages: MOCK_PACKAGES.map(p => ({ ...p, order_codes: [...p.order_codes] })),
  maxPerPackage: MAX_PER_PACKAGE,

  cancelOrder: (code) => {
    set(state => ({
      orders: state.orders.map(o => {
        if (o.order_code !== code) return o;
        return {
          ...o,
          status: 'CANCELLED',
          history: [
            ...o.history,
            {
              status: 'CANCELLED',
              created_at: new Date().toISOString(),
              note: 'Nhân viên hủy đơn trước khi xác nhận',
            },
          ],
        };
      }),
    }));
  },

  confirmOrder: (orderCode, pkgCode, isNew) => {
    const { orders, packages, maxPerPackage } = get();
    const order = orders.find(o => o.order_code === orderCode);
    if (!order || order.status !== 'PENDING') {
      return 'Đơn không thể xác nhận';
    }

    const trimmed = pkgCode.trim();
    if (!trimmed) return 'Vui lòng nhập tên gói';

    if (isNew) {
      if (packages.some(p => p.code.toLowerCase() === trimmed.toLowerCase())) {
        return `Gói ${trimmed} đã tồn tại`;
      }
      set(state => ({
        packages: [
          ...state.packages,
          {
            id: Math.max(0, ...state.packages.map(p => p.id)) + 1,
            code: trimmed,
            status: 'PENDING',
            order_codes: [orderCode],
          },
        ],
        orders: state.orders.map(o => {
          if (o.order_code !== orderCode) return o;
          return {
            ...o,
            status: 'CONFIRMED',
            package_code: trimmed,
            history: [
              ...o.history,
              {
                status: 'CONFIRMED',
                created_at: new Date().toISOString(),
                note: `Gắn vào gói ${trimmed}`,
              },
            ],
          };
        }),
      }));
      return null;
    }

    const pkg = packages.find(p => p.code === trimmed);
    if (!pkg) return `Không tìm thấy gói ${trimmed}`;
    if (pkg.status !== 'PENDING') return 'Chỉ được xếp đơn vào gói chưa giao';
    if (pkg.order_codes.length >= maxPerPackage) {
      return `Gói ${trimmed} đã đầy (${maxPerPackage} đơn)`;
    }
    if (pkg.order_codes.includes(orderCode)) {
      return 'Đơn đã có trong gói này';
    }

    set(state => ({
      packages: state.packages.map(p => {
        if (p.code !== trimmed) return p;
        return { ...p, order_codes: [...p.order_codes, orderCode] };
      }),
      orders: state.orders.map(o => {
        if (o.order_code !== orderCode) return o;
        return {
          ...o,
          status: 'CONFIRMED',
          package_code: trimmed,
          history: [
            ...o.history,
            {
              status: 'CONFIRMED',
              created_at: new Date().toISOString(),
              note: `Gắn vào gói ${trimmed}`,
            },
          ],
        };
      }),
    }));
    return null;
  },

  claimPackage: (pkgId, staffId) => {
    const { packages } = get();
    const held = packages.find(p => p.staff_id === staffId && p.status === 'DELIVERING');
    if (held) {
      return `Bạn đang giao gói ${held.code}, hãy hoàn thành trước khi nhận gói mới`;
    }

    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) return 'Không tìm thấy gói';
    if (pkg.status !== 'PENDING') return 'Gói này không còn chờ nhận';

    const now = new Date().toISOString();
    set(state => ({
      packages: state.packages.map(p => {
        if (p.id !== pkgId) return p;
        return { ...p, status: 'DELIVERING', staff_id: staffId };
      }),
      orders: state.orders.map(o => {
        if (!pkg.order_codes.includes(o.order_code)) return o;
        if (o.status !== 'CONFIRMED') return o;
        return {
          ...o,
          status: 'DELIVERING',
          history: [
            ...o.history,
            {
              status: 'DELIVERING',
              created_at: now,
              note: 'Nhân viên nhận giao gói',
            },
          ],
        };
      }),
    }));
    return null;
  },

  updateOrderStatus: (orderCode, newStatus) => {
    const now = new Date().toISOString();
    set(state => {
      const orders = state.orders.map(o => {
        if (o.order_code !== orderCode) return o;
        return {
          ...o,
          status: newStatus,
          history: [
            ...o.history,
            {
              status: newStatus,
              created_at: now,
              note: 'Nhân viên cập nhật trạng thái',
            },
          ],
        };
      });

      const order = orders.find(o => o.order_code === orderCode);
      const pkgCode = order?.package_code;
      let packages = state.packages;

      if (pkgCode) {
        const pkg = packages.find(p => p.code === pkgCode);
        if (pkg && pkg.status === 'DELIVERING') {
          const pkgOrders = orders.filter(o => pkg.order_codes.includes(o.order_code));
          const allDone = pkgOrders.every(
            o => o.status === 'DELIVERED' || o.status === 'CANCELLED'
          );
          if (allDone) {
            packages = packages.map(p =>
              p.code === pkgCode ? { ...p, status: 'COMPLETED' } : p
            );
          }
        }
      }

      return { orders, packages };
    });
  },
}));
