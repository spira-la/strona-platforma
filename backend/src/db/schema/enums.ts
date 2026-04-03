import { spiralaSchema } from './pg-schema.js';

export const userRoleEnum = spiralaSchema.enum('user_role', ['user', 'coach', 'admin']);

export const orderStatusEnum = spiralaSchema.enum('order_status', [
  'pending',
  'paid',
  'refunded',
]);

export const bookingStatusEnum = spiralaSchema.enum('booking_status', [
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
]);

export const subscriberStatusEnum = spiralaSchema.enum('subscriber_status', [
  'active',
  'unsubscribed',
]);

export const discountTypeEnum = spiralaSchema.enum('discount_type', [
  'fixed',
  'percentage',
]);

export const productTypeEnum = spiralaSchema.enum('product_type', [
  'audio',
  'ebook',
  'bundle',
  'youtube',
]);

export const webinarStatusEnum = spiralaSchema.enum('webinar_status', [
  'draft',
  'published',
  'live',
  'completed',
]);

export const webinarSessionStatusEnum = spiralaSchema.enum('webinar_session_status', [
  'scheduled',
  'live',
  'completed',
]);

export const purchaseStatusEnum = spiralaSchema.enum('purchase_status', [
  'active',
  'expired',
  'refunded',
]);
