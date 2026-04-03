import { text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { spiralaSchema } from './pg-schema.js';

export const featureFlags = spiralaSchema.table('feature_flags', {
  key: text('key').primaryKey(),
  enabled: boolean('enabled').default(false),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;
