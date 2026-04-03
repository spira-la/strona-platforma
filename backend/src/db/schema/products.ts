import {
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { productTypeEnum } from './enums.js';
import { coaches } from './coaches.js';
import { spiralaSchema } from './pg-schema.js';

export const categories = spiralaSchema.table(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    parentId: uuid('parent_id'),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('categories_slug_idx').on(table.slug)],
);

export const products = spiralaSchema.table(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    slug: text('slug').unique().notNull(),
    description: text('description'),
    productType: productTypeEnum('product_type'),
    categoryId: uuid('category_id').references(() => categories.id),
    coverImageUrl: text('cover_image_url'),
    durationMinutes: integer('duration_minutes'),
    language: text('language'),
    tags: text('tags').array(),
    priceCents: integer('price_cents'),
    currency: text('currency').default('PLN'),
    stripeProductId: text('stripe_product_id'),
    stripePriceId: text('stripe_price_id'),
    isPublished: boolean('is_published').default(false),
    authorId: uuid('author_id').references(() => coaches.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('products_slug_idx').on(table.slug),
    index('products_is_published_idx').on(table.isPublished),
    index('products_product_type_idx').on(table.productType),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
