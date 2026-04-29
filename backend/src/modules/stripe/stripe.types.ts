export interface CreatePaymentIntentInput {
  amountCents: number;
  currency: string;
  orderId: string;
  customerEmail?: string | null;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  id: string;
  clientSecret: string;
  status:
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'succeeded'
    | 'canceled';
  amountCents: number;
  currency: string;
  mocked: boolean;
}

export interface PaymentSucceededEvent {
  paymentIntentId: string;
  orderId: string;
  amountCents: number;
  currency: string;
  chargeId?: string | null;
  paymentMethod?: string | null;
  mocked: boolean;
}

export const PAYMENT_SUCCEEDED_EVENT = 'stripe.payment_intent.succeeded';
export const PAYMENT_FAILED_EVENT = 'stripe.payment_intent.failed';
