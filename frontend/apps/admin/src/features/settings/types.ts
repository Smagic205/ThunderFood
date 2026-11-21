export interface SystemSetting {
  id: number;
  key: string;
  value: string;
}

export interface ServiceWard {
  id: number;
  district: string;
  wardName: string;
  shippingFee: number;
  isActive: boolean;
}

export interface ServiceWardFilterParams {
  district?: string;
  keyword?: string;
  isActive?: boolean;
  page?: number;
  size?: number;
}
