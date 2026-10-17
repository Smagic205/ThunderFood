import { axiosClient } from '@/shared/api/axiosClient';
import type { DeliveryPackage } from '../types';

export const MOCK_PACKAGES: DeliveryPackage[] = [
  {
    id: 1,
    code: 'GOI-A',
    status: 'UNASSIGNED',
    staffId: null,
    staffName: null,
    orderCodes: ['ORD20260920002', 'ORD20260920001'],
    orders: [
      {
        orderCode: 'ORD20260920002',
        receiverName: 'Phạm Ngọc Mai',
        receiverPhone: '0868 112 900',
        shippingAddress: '101 Kim Mã, Phường Kim Mã, Quận Ba Đình, Hà Nội',
        totalAmount: 100000,
        status: 'CONFIRMED',
      },
      {
        orderCode: 'ORD20260920001',
        receiverName: 'Đỗ Văn Nam',
        receiverPhone: '0355 778 042',
        shippingAddress: '27 Hàng Bông, Phường Hàng Gai, Quận Hoàn Kiếm, Hà Nội',
        totalAmount: 318000,
        status: 'CONFIRMED',
      },
    ],
    createdAt: '2026-09-20 09:55',
  },
  {
    id: 2,
    code: 'GOI-B',
    status: 'DELIVERING',
    staffId: 103,
    staffName: 'Phạm Đức Toàn',
    orderCodes: ['ORD20260920004'],
    orders: [
      {
        orderCode: 'ORD20260920004',
        receiverName: 'Nguyễn Minh Anh',
        receiverPhone: '0912 345 678',
        shippingAddress: 'Số 18, ngõ 165 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
        totalAmount: 184200,
        status: 'DELIVERING',
      },
    ],
    createdAt: '2026-09-20 09:45',
  },
  {
    id: 3,
    code: 'GOI-C',
    status: 'COMPLETED',
    staffId: 102,
    staffName: 'Đặng Quốc Việt',
    orderCodes: ['ORD20260919011', 'ORD20260919010', 'ORD20260919009', 'ORD20260919008'],
    orders: [
      {
        orderCode: 'ORD20260919011',
        receiverName: 'Vũ Thanh Bình',
        receiverPhone: '0912 776 551',
        shippingAddress: '56 Lạc Long Quân, Phường Bưởi, Quận Tây Hồ, Hà Nội',
        totalAmount: 238000,
        status: 'DELIVERED',
      },
      {
        orderCode: 'ORD20260919010',
        receiverName: 'Nguyễn Hải Yến',
        receiverPhone: '0988 300 145',
        shippingAddress: '3 Nguyễn Văn Cừ, Phường Bồ Đề, Quận Long Biên, Hà Nội',
        totalAmount: 138000,
        status: 'DELIVERED',
      },
      {
        orderCode: 'ORD20260919009',
        receiverName: 'Bùi Đức Anh',
        receiverPhone: '0946 221 507',
        shippingAddress: '19 Trần Duy Hưng, Phường Trung Hòa, Quận Cầu Giấy, Hà Nội',
        totalAmount: 253200,
        status: 'DELIVERED',
      },
      {
        orderCode: 'ORD20260919008',
        receiverName: 'Hoàng Khánh Linh',
        receiverPhone: '0334 500 916',
        shippingAddress: '72 Tây Sơn, Phường Quang Trung, Quận Đống Đa, Hà Nội',
        totalAmount: 229000,
        status: 'CANCELLED',
      },
    ],
    createdAt: '2026-09-19 18:50',
  },
  {
    id: 4,
    code: 'GOI-D',
    status: 'COMPLETED',
    staffId: 102,
    staffName: 'Đặng Quốc Việt',
    orderCodes: ['ORD20260918002', 'ORD20260915007', 'ORD20260918006'],
    orders: [
      {
        orderCode: 'ORD20260918002',
        receiverName: 'Nguyễn Minh Anh',
        receiverPhone: '0912 345 678',
        shippingAddress: 'Tầng 12, Tòa Vincom, 191 Bà Triệu, Phường Lê Đại Hành, Quận Hai Bà Trưng, Hà Nội',
        totalAmount: 228000,
        status: 'DELIVERED',
      },
      {
        orderCode: 'ORD20260915007',
        receiverName: 'Nguyễn Minh Anh',
        receiverPhone: '0912 345 678',
        shippingAddress: 'Tầng 12, Tòa Vincom, 191 Bà Triệu, Phường Lê Đại Hành, Quận Hai Bà Trưng, Hà Nội',
        totalAmount: 245000,
        status: 'DELIVERED',
      },
      {
        orderCode: 'ORD20260918006',
        receiverName: 'Ngô Gia Bảo',
        receiverPhone: '0908 415 372',
        shippingAddress: '5 Lê Văn Lương, Phường Nhân Chính, Quận Thanh Xuân, Hà Nội',
        totalAmount: 182000,
        status: 'DELIVERED',
      },
    ],
    createdAt: '2026-09-18 19:10',
  },
  {
    id: 5,
    code: 'GOI-E',
    status: 'UNASSIGNED',
    staffId: null,
    staffName: null,
    orderCodes: ['ORD20260920006', 'ORD20260920003'],
    orders: [
      {
        orderCode: 'ORD20260920006',
        receiverName: 'Trần Thu Hà',
        receiverPhone: '0903 221 118',
        shippingAddress: '45 Nguyễn Trãi, Phường Khương Mai, Quận Thanh Xuân, Hà Nội',
        totalAmount: 191000,
        status: 'PENDING',
      },
      {
        orderCode: 'ORD20260920003',
        receiverName: 'Lê Quang Huy',
        receiverPhone: '0977 654 312',
        shippingAddress: '8 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
        totalAmount: 112000,
        status: 'PENDING',
      },
    ],
    createdAt: '2026-09-20 10:25',
  },
];

export const packagesApi = {
  getPackages: async (): Promise<DeliveryPackage[]> => {
    try {
      const res = await axiosClient.get('/admin/packages');
      if (res.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch {
      // Backend endpoint not ready; fallback to mock data
    }
    return MOCK_PACKAGES;
  },

  getPackageByCode: async (code: string): Promise<DeliveryPackage | null> => {
    try {
      const res = await axiosClient.get(`/admin/packages/${code}`);
      if (res.data && res.data.data) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }
    return MOCK_PACKAGES.find((p) => p.code.toLowerCase() === code.toLowerCase()) || null;
  },
};
