import {
  uuid,
  text,
  integer,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { webinarStatusEnum, webinarSessionStatusEnum } from './enums.js';
import { coaches } from './coaches.js';
import { profiles } from './profiles.js';
import { spiralaSchema } from './pg-schema.js';

export const webinars = spiralaSchema.table(
  'webinars',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    slug: text('slug').unique(),
    hostId: uuid('host_id').references(() => coaches.id),
    shadowHostId: uuid('shadow_host_id').references(() => coaches.id),
    adminSpeakerIds: uuid('admin_speaker_ids').array(),
    status: webinarStatusEnum('status').default('draft'),
    maxParticipants: integer('max_participants'),
    registeredCount: integer('registered_count').default(0),
    language: text('language'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('webinars_slug_idx').on(table.slug),
    index('webinars_status_idx').on(table.status),
  ],
);

export const webinarSessions = spiralaSchema.table(
  'webinar_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    webinarId: uuid('webinar_id').references(() => webinars.id, {
      onDelete: 'cascade',
    }),
    sessionNumber: integer('session_number'),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    status: webinarSessionStatusEnum('status').default('scheduled'),
    livekitRoomName: text('livekit_room_name'),
    recordingUrl: text('recording_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('webinar_sessions_webinar_id_idx').on(table.webinarId)],
);

export const webinarRegistrations = spiralaSchema.table(
  'webinar_registrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    webinarId: uuid('webinar_id').references(() => webinars.id, {
      onDelete: 'cascade',
    }),
    userId: uuid('user_id').references(() => profiles.id, {
      onDelete: 'cascade',
    }),
    registeredAt: timestamp('registered_at', {
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => [
    unique('webinar_registrations_unique').on(table.webinarId, table.userId),
    index('webinar_registrations_webinar_id_idx').on(table.webinarId),
    index('webinar_registrations_user_id_idx').on(table.userId),
  ],
);

export type Webinar = typeof webinars.$inferSelect;
export type NewWebinar = typeof webinars.$inferInsert;
export type WebinarSession = typeof webinarSessions.$inferSelect;
export type NewWebinarSession = typeof webinarSessions.$inferInsert;
export type WebinarRegistration = typeof webinarRegistrations.$inferSelect;
export type NewWebinarRegistration = typeof webinarRegistrations.$inferInsert;
