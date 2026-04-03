import {
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { coaches } from './coaches.js';
import { spiralaSchema } from './pg-schema.js';

export const coachingServices = spiralaSchema.table(
  'coaching_services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    coachId: uuid('coach_id').references(() => coaches.id, {
      onDelete: 'cascade',
    }),
    name: text('name').notNull(),
    description: text('description'),
    durationMinutes: integer('duration_minutes').notNull(),
    sessionCount: integer('session_count').default(1),
    priceCents: integer('price_cents').notNull(),
    currency: text('currency').default('PLN'),
    stripeProductId: text('stripe_product_id'),
    stripePriceId: text('stripe_price_id'),
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('coaching_services_coach_id_idx').on(table.coachId)],
);

export type CoachingService = typeof coachingServices.$inferSelect;
export type NewCoachingService = typeof coachingServices.$inferInsert;
