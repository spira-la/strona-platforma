import { api } from '@/clients/api';

export interface StripeConfig {
  mockMode: boolean;
  publishableKey: string | null;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

export const stripeClient = {
  getConfig(): Promise<StripeConfig> {
    return api.get<StripeConfig>('/stripe/config');
  },

  /**
   * Mock-mode only — simulate a successful payment. In real Stripe mode
   * the frontend confirms with Stripe.js using the client_secret, and the
   * webhook drives the same downstream effects this endpoint triggers.
   */
  mockConfirm(paymentIntentId: string): Promise<unknown> {
    return api
      .post<
        Envelope<unknown>
      >(`/stripe/mock/confirm/${encodeURIComponent(paymentIntentId)}`)
      .then((r) => r.data);
  },
};
