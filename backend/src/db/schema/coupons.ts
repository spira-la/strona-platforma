import {
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { discountTypeEnum } from './enums.js';
import { spiralaSchema } from './pg-schema.js';

export const coupons = spiralaSchema.table(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').unique().notNull(),
    discountType: discountTypeEnum('discount_type'),
    discountValue: integer('discount_value').notNull(),
    maxUses: integer('max_uses'),
    currentUses: integer('current_uses').default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('coupons_code_idx').on(table.code)],
);

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
