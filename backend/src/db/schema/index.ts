// Custom PostgreSQL schema (must come first)
export * from './pg-schema.js';

// Enums — must come first, no local dependencies
export * from './enums.js';

// Feature flags — standalone
export * from './feature-flags.js';

// Core entities
export * from './profiles.js';
export * from './coaches.js';
export * from './coaching-services.js';
export * from './availability.js';

// Commerce
export * from './coupons.js';
export * from './orders.js';
export * from './bookings.js';
export * from './invoices.js';

// Content
export * from './blog.js';
export * from './newsletter.js';

// Products & purchases (hidden behind feature flags)
export * from './products.js';
export * from './purchases.js';
export * from './reviews.js';
export * from './gifts.js';

// Webinars (hidden behind feature flag)
export * from './webinars.js';

// Utility / CRM
export * from './contact.js';
export * from './cms.js';

// All cross-table relations (must come last — imports from all tables above)
export * from './relations.js';
