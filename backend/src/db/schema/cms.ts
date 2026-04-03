import { text, integer, uuid, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { profiles } from './profiles.js';
import { spiralaSchema } from './pg-schema.js';

export const cmsContent = spiralaSchema.table('cms_content', {
  id: text('id').primaryKey().default('main_page'),
  content: jsonb('content').notNull(),
  version: integer('version').default(1),
  updatedBy: uuid('updated_by').references(() => profiles.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type CmsContent = typeof cmsContent.$inferSelect;
export type NewCmsContent = typeof cmsContent.$inferInsert;
