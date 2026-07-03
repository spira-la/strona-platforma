export enum UserRole {
  USER = 'user',
  COACH = 'coach',
  ADMIN = 'admin',
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum SubscriberStatus {
  ACTIVE = 'active',
  UNSUBSCRIBED = 'unsubscribed',
}

export enum DiscountType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

export enum ProductType {
  AUDIO = 'audio',
  EBOOK = 'ebook',
  BUNDLE = 'bundle',
  YOUTUBE = 'youtube',
}

export enum WebinarStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  LIVE = 'live',
  COMPLETED = 'completed',
}

export enum WebinarSessionStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  COMPLETED = 'completed',
}

export enum PurchaseStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
}

export enum BlogPostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}
