import {
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { profiles } from './profiles.js';
import { products } from './products.js';
import { coaches } from './coaches.js';
import { spiralaSchema } from './pg-schema.js';

export const reviews = spiralaSchema.table(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => profiles.id)
      .notNull(),
    productId: uuid('product_id').references(() => products.id),
    coachId: uuid('coach_id').references(() => coaches.id),
    // CHECK (rating BETWEEN 1 AND 5) enforced at application layer via Zod
    rating: integer('rating').notNull(),
    content: text('content'),
    isPublished: boolean('is_published').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('reviews_user_id_idx').on(table.userId),
    index('reviews_product_id_idx').on(table.productId),
    index('reviews_coach_id_idx').on(table.coachId),
  ],
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
