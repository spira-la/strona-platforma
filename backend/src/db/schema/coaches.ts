import {
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { profiles } from './profiles.js';
import { spiralaSchema } from './pg-schema.js';

export const coaches = spiralaSchema.table(
  'coaches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .unique()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    bio: text('bio'),
    expertise: text('expertise').array(),
    languages: text('languages').array(),
    location: text('location'),
    website: text('website'),
    timezone: text('timezone').default('Europe/Warsaw'),
    acceptingClients: boolean('accepting_clients').default(true),
    stripeConnectId: text('stripe_connect_id'),
    yearsExperience: integer('years_experience'),
    certifications: text('certifications').array(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('coaches_user_id_idx').on(table.userId)],
);

export type Coach = typeof coaches.$inferSelect;
export type NewCoach = typeof coaches.$inferInsert;
