import {
  uuid,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums.js';
import { spiralaSchema } from './pg-schema.js';

export const profiles = spiralaSchema.table('profiles', {
  id: uuid('id').primaryKey(),
  fullName: text('full_name'),
  email: text('email').unique().notNull(),
  phone: text('phone'),
  timezone: text('timezone').default('Europe/Warsaw'),
  locale: text('locale').default('pl'),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').default('user'),
  disabled: boolean('disabled').default(false),
  disabledReason: text('disabled_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
