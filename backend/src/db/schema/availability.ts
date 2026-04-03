import {
  uuid,
  text,
  boolean,
  integer,
  date,
  time,
  index,
} from 'drizzle-orm/pg-core';
import { coaches } from './coaches.js';
import { spiralaSchema } from './pg-schema.js';

export const availability = spiralaSchema.table(
  'availability',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    coachId: uuid('coach_id').references(() => coaches.id, {
      onDelete: 'cascade',
    }),
    // 0 = Sunday … 6 = Saturday
    dayOfWeek: integer('day_of_week'),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    isActive: boolean('is_active').default(true),
  },
  (table) => [index('availability_coach_id_idx').on(table.coachId)],
);

export const availabilityBlocks = spiralaSchema.table(
  'availability_blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    coachId: uuid('coach_id').references(() => coaches.id, {
      onDelete: 'cascade',
    }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    reason: text('reason'),
  },
  (table) => [index('availability_blocks_coach_id_idx').on(table.coachId)],
);

export type Availability = typeof availability.$inferSelect;
export type NewAvailability = typeof availability.$inferInsert;
export type AvailabilityBlock = typeof availabilityBlocks.$inferSelect;
export type NewAvailabilityBlock = typeof availabilityBlocks.$inferInsert;
