import type { OrderStatus } from '@/features/orders/types';

export type PackageStatus = 'UNASSIGNED' | 'DELIVERING' | 'COMPLETED';

export type PackageFilterTab = 'ALL' | PackageStatus;

export interface PackageOrderItem {
  orderCode: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: OrderStatus;
}

export interface DeliveryPackage {
  id: number;
  code: string;
  status: PackageStatus;
  staffId: number | null;
  staffName: string | null;
  orderCodes: string[];
  orders: PackageOrderItem[];
  createdAt: string;
}
