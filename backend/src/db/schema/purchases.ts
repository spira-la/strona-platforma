import {
  uuid,
  integer,
  boolean,
  numeric,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { purchaseStatusEnum } from './enums.js';
import { profiles } from './profiles.js';
import { products } from './products.js';
import { orders } from './orders.js';
import { spiralaSchema } from './pg-schema.js';

export const purchases = spiralaSchema.table(
  'purchases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => profiles.id)
      .notNull(),
    productId: uuid('product_id')
      .references(() => products.id)
      .notNull(),
    orderId: uuid('order_id').references(() => orders.id),
    status: purchaseStatusEnum('status').default('active'),
    purchasedAt: timestamp('purchased_at', { withTimezone: true }).defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => [
    unique('purchases_user_product_unique').on(table.userId, table.productId),
    index('purchases_user_id_idx').on(table.userId),
    index('purchases_product_id_idx').on(table.productId),
  ],
);

export const userProgress = spiralaSchema.table(
  'user_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => profiles.id)
      .notNull(),
    productId: uuid('product_id')
      .references(() => products.id)
      .notNull(),
    progressPercent: numeric('progress_percent', {
      precision: 5,
      scale: 2,
    }).default('0'),
    currentPositionSeconds: integer('current_position_seconds'),
    currentPage: integer('current_page'),
    chaptersCompleted: uuid('chapters_completed').array(),
    isCompleted: boolean('is_completed').default(false),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    lastAccessedAt: timestamp('last_accessed_at', {
      withTimezone: true,
    }).defaultNow(),
    timeSpentMinutes: integer('time_spent_minutes').default(0),
  },
  (table) => [
    unique('user_progress_user_product_unique').on(
      table.userId,
      table.productId,
    ),
    index('user_progress_user_id_idx').on(table.userId),
  ],
);

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;
