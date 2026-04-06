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
  coupons: Coupon[];
  total: number;
}

interface CouponResponse {
  success: boolean;
  coupon: Coupon;
}

interface DeleteResponse {
  success: boolean;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export const couponsClient = {
  getAll(): Promise<GetAllResponse> {
    return api.get<GetAllResponse>('/coupons');
  },

  create(data: CreateCouponData): Promise<Coupon> {
    return api
      .post<CouponResponse>('/coupons', data)
      .then((res) => res.coupon);
  },

  update(id: string, data: UpdateCouponData): Promise<Coupon> {
    return api
      .put<CouponResponse>(`/coupons/${id}`, data)
      .then((res) => res.coupon);
  },

  remove(id: string): Promise<void> {
    return api.delete<DeleteResponse>(`/coupons/${id}`).then(() => undefined);
  },
};
