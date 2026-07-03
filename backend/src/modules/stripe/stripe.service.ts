import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';
import { PAYMENT_SUCCEEDED_EVENT } from './stripe.types.js';
import type {
  CreatePaymentIntentInput,
  PaymentIntentResult,
  PaymentSucceededEvent,
} from './stripe.types.js';

// The `stripe` package ships CJS-shaped types that expose the class as
// `Stripe.Stripe` rather than the top-level `Stripe`. Re-alias it so
// the rest of this file can read naturally.
type StripeClient = Stripe.Stripe;

interface StripeEvent {
  id: string;
  type: string;
  data: { object: unknown };
}

interface StripePaymentIntentShape {
  id: string;
  amount: number;
  amount_received?: number | null;
  currency: string;
  status: string;
  metadata?: Record<string, string> | null;
  latest_charge?: string | null | { id: string };
  payment_method?: string | null | { id: string };
}

/**
 * StripeService — single integration point for payment intents.
 *
 * Two modes:
 *  - REAL:  STRIPE_SECRET_KEY is set and STRIPE_MOCK_MODE !== 'true'.
 *           Uses the Stripe Node SDK; webhook signature is verified.
 *  - MOCK:  no real API calls. Returns Stripe-shaped data so the frontend
 *           and downstream services behave identically. The shape,
 *           endpoints, event payloads, and metadata keys are the same —
 *           flipping to real Stripe means providing the env var, no code
 *           changes.
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: StripeClient | null;
  private readonly webhookSecret: string | null;
  public readonly isMockMode: boolean;

  // In-memory registry of mock PaymentIntents (keyed by id) so the mock
  // confirm endpoint can validate an id exists before emitting success.
  private readonly mockPaymentIntents = new Map<
    string,
    {
      amountCents: number;
      currency: string;
      orderId: string;
      customerEmail: string | null;
      status: PaymentIntentResult['status'];
    }
  >();

  constructor(
    private readonly config: ConfigService,
    private readonly events: EventEmitter2,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    const forceMock = this.config.get<string>('STRIPE_MOCK_MODE') === 'true';

    this.isMockMode = !key || forceMock;
    this.webhookSecret =
      this.config.get<string>('STRIPE_WEBHOOK_SECRET') || null;

    if (this.isMockMode) {
      this.client = null;
      this.logger.warn(
        'StripeService running in MOCK mode — no real payments will be processed',
      );
    } else {
      this.client = new Stripe(key!);
      this.logger.log('StripeService running in REAL mode');
    }
  }

  /**
   * Create a PaymentIntent.
   * Frontend uses clientSecret with Stripe.js to confirm the payment.
   * In mock mode, frontend calls POST /api/stripe/mock/confirm/:id instead.
   */
  async createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<PaymentIntentResult> {
    if (input.amountCents <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const metadata = {
      orderId: input.orderId,
      ...input.metadata,
    };

    if (this.isMockMode) {
      const id = `mock_pi_${randomUUID().replaceAll('-', '')}`;
      const clientSecret = `${id}_secret_${randomUUID().replaceAll('-', '')}`;

      this.mockPaymentIntents.set(id, {
        amountCents: input.amountCents,
        currency: input.currency.toLowerCase(),
        orderId: input.orderId,
        customerEmail: input.customerEmail ?? null,
        status: 'requires_payment_method',
      });

      this.logger.log(
        `[MOCK] created PaymentIntent ${id} for order ${input.orderId}, ${input.amountCents} ${input.currency}`,
      );

      return {
        id,
        clientSecret,
        status: 'requires_payment_method',
        amountCents: input.amountCents,
        currency: input.currency.toLowerCase(),
        mocked: true,
      };
    }

    const pi = await this.client!.paymentIntents.create({
      amount: input.amountCents,
      currency: input.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata,
      description: input.description,
      receipt_email: input.customerEmail ?? undefined,
    });

    return {
      id: pi.id,
      clientSecret: pi.client_secret ?? '',
      status: pi.status as PaymentIntentResult['status'],
      amountCents: pi.amount,
      currency: pi.currency,
      mocked: false,
    };
  }

  /**
   * Mock-mode only — simulate a successful payment from the frontend.
   * Emits the same event a real Stripe webhook would emit.
   */
  // eslint-disable-next-line @typescript-eslint/require-await -- kept async for interface stability; emits events synchronously
  async mockConfirm(paymentIntentId: string): Promise<PaymentIntentResult> {
    if (!this.isMockMode) {
      throw new BadRequestException(
        'mockConfirm is only available in mock mode',
      );
    }

    const stored = this.mockPaymentIntents.get(paymentIntentId);
    if (!stored) {
      throw new BadRequestException(
        `Mock PaymentIntent not found: ${paymentIntentId}`,
      );
    }

    stored.status = 'succeeded';

    this.logger.log(
      `[MOCK] confirmed PaymentIntent ${paymentIntentId} — emitting ${PAYMENT_SUCCEEDED_EVENT}`,
    );

    const event: PaymentSucceededEvent = {
      paymentIntentId,
      orderId: stored.orderId,
      amountCents: stored.amountCents,
      currency: stored.currency,
      chargeId: `mock_ch_${randomUUID().replaceAll('-', '')}`,
      paymentMethod: 'card',
      mocked: true,
    };

    // Fire-and-forget; async listeners handle DB writes / emails.
    this.events.emit(PAYMENT_SUCCEEDED_EVENT, event);

    return {
      id: paymentIntentId,
      clientSecret: `${paymentIntentId}_secret_mock`,
      status: 'succeeded',
      amountCents: stored.amountCents,
      currency: stored.currency,
      mocked: true,
    };
  }

  /**
   * Real-mode webhook handler. Verifies signature, parses the event,
   * and emits on the internal bus using the same shape mock-mode uses.
   */
  // eslint-disable-next-line @typescript-eslint/require-await -- kept async for interface stability; emits events synchronously
  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    if (this.isMockMode) {
      throw new BadRequestException(
        'Webhook is disabled in mock mode; use POST /api/stripe/mock/confirm/:id',
      );
    }
    if (!this.webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured');
    }
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature header');
    }

    let event: StripeEvent;
    try {
      event = this.client!.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      ) as unknown as StripeEvent;
    } catch (error) {
      const msg = (error as Error).message;
      this.logger.error(`Webhook signature verification failed: ${msg}`);
      throw new BadRequestException('Invalid Stripe signature');
    }

    this.logger.log(`Stripe webhook received: ${event.type} (${event.id})`);

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as StripePaymentIntentShape;
      const orderId = pi.metadata?.orderId;
      if (!orderId) {
        this.logger.warn(
          `PaymentIntent ${pi.id} succeeded but has no orderId metadata — ignoring`,
        );
        return { received: true };
      }

      const payload: PaymentSucceededEvent = {
        paymentIntentId: pi.id,
        orderId,
        amountCents: pi.amount_received ?? pi.amount,
        currency: pi.currency,
        chargeId:
          typeof pi.latest_charge === 'string' ? pi.latest_charge : null,
        paymentMethod:
          typeof pi.payment_method === 'string' ? pi.payment_method : null,
        mocked: false,
      };

      this.events.emit(PAYMENT_SUCCEEDED_EVENT, payload);
    } else {
      this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true };
  }
}
