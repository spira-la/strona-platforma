/**
 * Centralized Drizzle relations.
 *
 * Keeping all `relations()` calls in one file avoids circular module-level
 * imports between schema files while still giving Drizzle's query builder
 * full knowledge of every relationship.
 */
import { relations } from 'drizzle-orm';

import { profiles } from './profiles.js';
import { coaches } from './coaches.js';
import { coachingServices } from './coaching-services.js';
import { availability, availabilityBlocks } from './availability.js';
import { coupons } from './coupons.js';
import { orders } from './orders.js';
import { bookings } from './bookings.js';
import { invoices } from './invoices.js';
import { blogPosts, blogComments } from './blog.js';
import { newsletterSubscribers } from './newsletter.js';
import { categories, products } from './products.js';
import { purchases, userProgress } from './purchases.js';
import { webinars, webinarSessions, webinarRegistrations } from './webinars.js';
import { gifts } from './gifts.js';
import { reviews } from './reviews.js';
import { cmsContent } from './cms.js';

// ─── profiles ────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  coach: one(coaches, {
    fields: [profiles.id],
    references: [coaches.userId],
  }),
  orders: many(orders),
  bookings: many(bookings),
  blogPosts: many(blogPosts),
  blogComments: many(blogComments),
  reviews: many(reviews),
  webinarRegistrations: many(webinarRegistrations),
}));

// ─── coaches ──────────────────────────────────────────────────────────────────

export const coachesRelations = relations(coaches, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [coaches.userId],
    references: [profiles.id],
  }),
  services: many(coachingServices),
  availability: many(availability),
  availabilityBlocks: many(availabilityBlocks),
  bookings: many(bookings),
  newsletterSubscribers: many(newsletterSubscribers),
  products: many(products),
  reviews: many(reviews),
  hostedWebinars: many(webinars, { relationName: 'host' }),
  shadowHostWebinars: many(webinars, { relationName: 'shadowHost' }),
}));

// ─── coaching_services ────────────────────────────────────────────────────────

export const coachingServicesRelations = relations(
  coachingServices,
  ({ one, many }) => ({
    coach: one(coaches, {
      fields: [coachingServices.coachId],
      references: [coaches.id],
    }),
    orders: many(orders),
  }),
);

// ─── availability ─────────────────────────────────────────────────────────────

export const availabilityRelations = relations(availability, ({ one }) => ({
  coach: one(coaches, {
    fields: [availability.coachId],
    references: [coaches.id],
  }),
}));

export const availabilityBlocksRelations = relations(
  availabilityBlocks,
  ({ one }) => ({
    coach: one(coaches, {
      fields: [availabilityBlocks.coachId],
      references: [coaches.id],
    }),
  }),
);

// ─── coupons ──────────────────────────────────────────────────────────────────

export const couponsRelations = relations(coupons, ({ many }) => ({
  orders: many(orders),
}));

// ─── orders ───────────────────────────────────────────────────────────────────

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(profiles, {
    fields: [orders.userId],
    references: [profiles.id],
  }),
  service: one(coachingServices, {
    fields: [orders.serviceId],
    references: [coachingServices.id],
  }),
  coupon: one(coupons, {
    fields: [orders.couponId],
    references: [coupons.id],
  }),
  bookings: many(bookings),
  invoice: one(invoices),
  purchases: many(purchases),
  gifts: many(gifts),
}));

// ─── bookings ─────────────────────────────────────────────────────────────────

export const bookingsRelations = relations(bookings, ({ one }) => ({
  order: one(orders, {
    fields: [bookings.orderId],
    references: [orders.id],
  }),
  coach: one(coaches, {
    fields: [bookings.coachId],
    references: [coaches.id],
  }),
  user: one(profiles, {
    fields: [bookings.userId],
    references: [profiles.id],
  }),
}));

// ─── invoices ─────────────────────────────────────────────────────────────────

export const invoicesRelations = relations(invoices, ({ one }) => ({
  order: one(orders, {
    fields: [invoices.orderId],
    references: [orders.id],
  }),
}));

// ─── blog ─────────────────────────────────────────────────────────────────────

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(profiles, {
    fields: [blogPosts.authorId],
    references: [profiles.id],
  }),
  comments: many(blogComments),
}));

export const blogCommentsRelations = relations(blogComments, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogComments.postId],
    references: [blogPosts.id],
  }),
  user: one(profiles, {
    fields: [blogComments.userId],
    references: [profiles.id],
  }),
}));

// ─── newsletter ───────────────────────────────────────────────────────────────

export const newsletterSubscribersRelations = relations(
  newsletterSubscribers,
  ({ one }) => ({
    coach: one(coaches, {
      fields: [newsletterSubscribers.coachId],
      references: [coaches.id],
    }),
  }),
);

// ─── categories & products ────────────────────────────────────────────────────

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parentCategory',
  }),
  children: many(categories, { relationName: 'parentCategory' }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  author: one(coaches, {
    fields: [products.authorId],
    references: [coaches.id],
  }),
  purchases: many(purchases),
  reviews: many(reviews),
  gifts: many(gifts),
}));

// ─── purchases & user_progress ────────────────────────────────────────────────

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(profiles, {
    fields: [purchases.userId],
    references: [profiles.id],
  }),
  product: one(products, {
    fields: [purchases.productId],
    references: [products.id],
  }),
  order: one(orders, {
    fields: [purchases.orderId],
    references: [orders.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(profiles, {
    fields: [userProgress.userId],
    references: [profiles.id],
  }),
  product: one(products, {
    fields: [userProgress.productId],
    references: [products.id],
  }),
}));

// ─── webinars ─────────────────────────────────────────────────────────────────

export const webinarsRelations = relations(webinars, ({ one, many }) => ({
  host: one(coaches, {
    fields: [webinars.hostId],
    references: [coaches.id],
    relationName: 'host',
  }),
  shadowHost: one(coaches, {
    fields: [webinars.shadowHostId],
    references: [coaches.id],
    relationName: 'shadowHost',
  }),
  sessions: many(webinarSessions),
  registrations: many(webinarRegistrations),
}));

export const webinarSessionsRelations = relations(
  webinarSessions,
  ({ one }) => ({
    webinar: one(webinars, {
      fields: [webinarSessions.webinarId],
      references: [webinars.id],
    }),
  }),
);

export const webinarRegistrationsRelations = relations(
  webinarRegistrations,
  ({ one }) => ({
    webinar: one(webinars, {
      fields: [webinarRegistrations.webinarId],
      references: [webinars.id],
    }),
    user: one(profiles, {
      fields: [webinarRegistrations.userId],
      references: [profiles.id],
    }),
  }),
);

// ─── gifts ────────────────────────────────────────────────────────────────────

export const giftsRelations = relations(gifts, ({ one }) => ({
  order: one(orders, {
    fields: [gifts.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [gifts.productId],
    references: [products.id],
  }),
  redeemedByProfile: one(profiles, {
    fields: [gifts.redeemedBy],
    references: [profiles.id],
  }),
}));

// ─── reviews ──────────────────────────────────────────────────────────────────

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(profiles, {
    fields: [reviews.userId],
    references: [profiles.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  coach: one(coaches, {
    fields: [reviews.coachId],
    references: [coaches.id],
  }),
}));

// ─── cms ──────────────────────────────────────────────────────────────────────

export const cmsContentRelations = relations(cmsContent, ({ one }) => ({
  updatedByProfile: one(profiles, {
    fields: [cmsContent.updatedBy],
    references: [profiles.id],
  }),
}));
