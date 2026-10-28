import axios from 'axios';
import { axiosClient } from './axiosClient';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ServiceWard {
  id: number;
  wardName: string;
  type: string;
  displayName: string;
  shippingFee: number;
  isActive: boolean;
}

export interface CustomerAddress {
  id: number;
  receiverName: string;
  phone: string;
  detailAddress: string;
  ward: ServiceWard;
  fullAddress: string;
  isDefault: boolean;
  createdAt: string | null;
}

export interface AddressPayload {
  detailAddress: string;
  wardId: number;
  receiverName: string;
  phone: string;
  isDefault?: boolean;
}

const unwrap = <T>(response: ApiResponse<T>, fallback: string): T => {
  if (!response.success) throw new Error(response.message || fallback);
  return response.data;
};

const getRequestError = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return new Error(error.response?.data?.message || fallback);
  }
  return error instanceof Error ? error : new Error(fallback);
};

export const addressApi = {
  getServiceWards: async (): Promise<ServiceWard[]> => {
    try {
      const response = await axiosClient.get<ApiResponse<ServiceWard[]>>('/v1/addresses/wards');
      return unwrap(response.data, 'Không thể tải danh sách phường/xã');
    } catch (error) {
      throw getRequestError(error, 'Không thể tải danh sách phường/xã');
    }
  },

  getMyAddresses: async (): Promise<CustomerAddress[]> => {
    try {
      const response = await axiosClient.get<ApiResponse<CustomerAddress[]>>('/v1/addresses');
      return unwrap(response.data, 'Không thể tải danh sách địa chỉ');
    } catch (error) {
      throw getRequestError(error, 'Không thể tải danh sách địa chỉ');
    }
  },

  create: async (payload: AddressPayload): Promise<CustomerAddress> => {
    try {
      const response = await axiosClient.post<ApiResponse<CustomerAddress>>('/v1/addresses', payload);
      return unwrap(response.data, 'Không thể thêm địa chỉ');
    } catch (error) {
      throw getRequestError(error, 'Không thể thêm địa chỉ');
    }
  },

  update: async (id: number, payload: AddressPayload): Promise<CustomerAddress> => {
    try {
      const response = await axiosClient.put<ApiResponse<CustomerAddress>>(`/v1/addresses/${id}`, payload);
      return unwrap(response.data, 'Không thể cập nhật địa chỉ');
    } catch (error) {
      throw getRequestError(error, 'Không thể cập nhật địa chỉ');
    }
  },

  setDefault: async (id: number): Promise<CustomerAddress> => {
    try {
      const response = await axiosClient.patch<ApiResponse<CustomerAddress>>(`/v1/addresses/${id}/default`);
      return unwrap(response.data, 'Không thể đặt địa chỉ mặc định');
    } catch (error) {
      throw getRequestError(error, 'Không thể đặt địa chỉ mặc định');
    }
  },

  remove: async (id: number): Promise<void> => {
    try {
      const response = await axiosClient.delete<ApiResponse<null>>(`/v1/addresses/${id}`);
      unwrap(response.data, 'Không thể xóa địa chỉ');
    } catch (error) {
      throw getRequestError(error, 'Không thể xóa địa chỉ');
    }
  },
};
