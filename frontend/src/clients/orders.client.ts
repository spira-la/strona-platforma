import { api } from '@/clients/api';
import type { InvoiceData } from '@/stores/cart.store';

export interface CreateOrderPayload {
  serviceId: string;
  coachId: string;
  userId?: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  slots: Array<{ startTime: string; endTime: string; holdId?: string }>;
  couponCode?: string | null;
  invoiceData?: InvoiceData | null;
  notes?: string | null;
}

export interface CreateOrderResponse {
  orderId: string;
  status: string;
  amountCents: number;
  currency: string;
  paymentIntent: {
    id: string;
    clientSecret: string;
    mocked: boolean;
  };
}

export interface Order {
  id: string;
  status: 'pending' | 'paid' | 'refunded' | null;
  amountCents: number;
  currency: string | null;
  discountCents: number | null;
  stripePaymentIntentId: string | null;
  sessionsTotal: number;
  sessionsRemaining: number;
  customerEmail: string | null;
  customerName: string | null;
  serviceId: string | null;
  coachId: string | null;
  paidAt: string | null;
  createdAt: string | null;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

export const ordersClient = {
  create(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    return api
      .post<Envelope<CreateOrderResponse>>('/orders', payload)
      .then((r) => r.data);
  },

  getById(id: string): Promise<Order> {
    return api.get<Envelope<Order>>(`/orders/${id}`).then((r) => r.data);
  },
};
