import { api } from '@/clients/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Coupon {
  id: string;
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCouponData {
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  maxUses: number | null;
  expiresAt: string | null;
  isActive: boolean;
}

export type UpdateCouponData = Partial<CreateCouponData>;

interface GetAllResponse {
  success: boolean;
  data: Coupon[];
}

interface CouponResponse {
  success: boolean;
  data: Coupon;
}

interface DeleteResponse {
  success: boolean;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export const couponsClient = {
  getAll(): Promise<Coupon[]> {
    return api.get<GetAllResponse>('/coupons').then((res) => res.data);
  },

  create(data: CreateCouponData): Promise<Coupon> {
    return api
      .post<CouponResponse>('/coupons', data)
      .then((res) => res.data);
  },

  update(id: string, data: UpdateCouponData): Promise<Coupon> {
    return api
      .put<CouponResponse>(`/coupons/${id}`, data)
      .then((res) => res.data);
  },

  remove(id: string): Promise<void> {
    return api.delete<DeleteResponse>(`/coupons/${id}`).then(() => undefined);
  },
};
