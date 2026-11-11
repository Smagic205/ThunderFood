export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'LOCKED';

export interface UserAdminItem {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  authProvider?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserFilterParams {
  keyword?: string;
  role?: string;
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

export interface UpdateUserStatusPayload {
  status: UserStatus;
}

export interface UpdateUserRolePayload {
  role: UserRole;
}
