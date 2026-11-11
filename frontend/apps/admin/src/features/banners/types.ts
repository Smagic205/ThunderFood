export interface BannerItem {
  id: number;
  imageUrl: string;
  linkUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateBannerPayload {
  imageUrl: string;
  linkUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateBannerPayload {
  imageUrl: string;
  linkUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}
