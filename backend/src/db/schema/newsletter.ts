import {
  uuid,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { subscriberStatusEnum } from './enums.js';
import { coaches } from './coaches.js';
import { spiralaSchema } from './pg-schema.js';

export const newsletterSubscribers = spiralaSchema.table(
  'newsletter_subscribers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique().notNull(),
    coachId: uuid('coach_id').references(() => coaches.id),
    status: subscriberStatusEnum('status').default('active'),
    unsubscribeToken: text('unsubscribe_token').unique(),
    subscribedAt: timestamp('subscribed_at', {
      withTimezone: true,
    }).defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  },
  (table) => [
    index('newsletter_subscribers_email_idx').on(table.email),
    index('newsletter_subscribers_coach_id_idx').on(table.coachId),
  ],
);

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type NewNewsletterSubscriber =
  typeof newsletterSubscribers.$inferInsert;
