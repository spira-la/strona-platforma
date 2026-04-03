import {
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { orders } from './orders.js';
import { products } from './products.js';
import { profiles } from './profiles.js';
import { spiralaSchema } from './pg-schema.js';

export const gifts = spiralaSchema.table(
  'gifts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').references(() => orders.id),
    productId: uuid('product_id').references(() => products.id),
    senderName: text('sender_name'),
    recipientEmail: text('recipient_email').notNull(),
    recipientName: text('recipient_name'),
    message: text('message'),
    redeemCode: text('redeem_code').unique().notNull(),
    isRedeemed: boolean('is_redeemed').default(false),
    redeemedBy: uuid('redeemed_by').references(() => profiles.id),
    redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('gifts_redeem_code_idx').on(table.redeemCode),
    index('gifts_recipient_email_idx').on(table.recipientEmail),
  ],
);

export type Gift = typeof gifts.$inferSelect;
export type NewGift = typeof gifts.$inferInsert;
