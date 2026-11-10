export interface StaffAccount {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface CreateStaffPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

