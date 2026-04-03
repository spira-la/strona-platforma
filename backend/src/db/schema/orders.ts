import {
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { orderStatusEnum } from './enums.js';
import { profiles } from './profiles.js';
import { coachingServices } from './coaching-services.js';
import { coupons } from './coupons.js';
import { spiralaSchema } from './pg-schema.js';

export const orders = spiralaSchema.table(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => profiles.id),
    serviceId: uuid('service_id').references(() => coachingServices.id),
    status: orderStatusEnum('status').default('pending'),
    amountCents: integer('amount_cents').notNull(),
    taxCents: integer('tax_cents').default(0),
    currency: text('currency').default('PLN'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    sessionsTotal: integer('sessions_total').notNull(),
    sessionsRemaining: integer('sessions_remaining').notNull(),
    invoiceNumber: text('invoice_number'),
    couponId: uuid('coupon_id').references(() => coupons.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
  },
  (table) => [
    index('orders_user_id_idx').on(table.userId),
    index('orders_status_idx').on(table.status),
    index('orders_stripe_payment_intent_idx').on(table.stripePaymentIntentId),
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
