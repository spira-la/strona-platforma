import {
  uuid,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { bookingStatusEnum } from './enums.js';
import { orders } from './orders.js';
import { coaches } from './coaches.js';
import { profiles } from './profiles.js';
import { spiralaSchema } from './pg-schema.js';

export const bookings = spiralaSchema.table(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').references(() => orders.id),
    coachId: uuid('coach_id')
      .references(() => coaches.id)
      .notNull(),
    userId: uuid('user_id')
      .references(() => profiles.id)
      .notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    status: bookingStatusEnum('status').default('confirmed'),
    meetingLink: text('meeting_link'),
    notes: text('notes'),
    cancellationReason: text('cancellation_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('bookings_coach_id_idx').on(table.coachId),
    index('bookings_user_id_idx').on(table.userId),
    index('bookings_start_time_idx').on(table.startTime),
    index('bookings_status_idx').on(table.status),
  ],
);

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
