export * from './enums.js';
export * from './profile.entity.js';
export * from './coach.entity.js';
export * from './coaching-service.entity.js';
export * from './availability.entity.js';
export * from './coupon.entity.js';
export * from './order.entity.js';
export * from './booking.entity.js';
export * from './invoice.entity.js';
export * from './blog.entity.js';
export * from './newsletter.entity.js';
export * from './contact.entity.js';
export * from './cms-content.entity.js';
export * from './feature-flag.entity.js';
export * from './product.entity.js';
export * from './purchase.entity.js';
export * from './webinar.entity.js';
export * from './gift.entity.js';
export * from './review.entity.js';

import { ProfileEntity } from './profile.entity.js';
import { CoachEntity } from './coach.entity.js';
import { CoachingServiceEntity } from './coaching-service.entity.js';
import { AvailabilityEntity, AvailabilityBlockEntity } from './availability.entity.js';
import { CouponEntity } from './coupon.entity.js';
import { OrderEntity } from './order.entity.js';
import { BookingEntity } from './booking.entity.js';
import { InvoiceEntity } from './invoice.entity.js';
import { BlogPostEntity, BlogCommentEntity } from './blog.entity.js';
import { NewsletterSubscriberEntity } from './newsletter.entity.js';
import { ContactMessageEntity } from './contact.entity.js';
import { CmsContentEntity } from './cms-content.entity.js';
import { FeatureFlagEntity } from './feature-flag.entity.js';
import { CategoryEntity, ProductEntity } from './product.entity.js';
import { PurchaseEntity, UserProgressEntity } from './purchase.entity.js';
import { WebinarEntity, WebinarSessionEntity, WebinarRegistrationEntity } from './webinar.entity.js';
import { GiftEntity } from './gift.entity.js';
import { ReviewEntity } from './review.entity.js';

export const ALL_ENTITIES = [
  ProfileEntity,
  CoachEntity,
  CoachingServiceEntity,
  AvailabilityEntity,
  AvailabilityBlockEntity,
  CouponEntity,
  OrderEntity,
  BookingEntity,
  InvoiceEntity,
  BlogPostEntity,
  BlogCommentEntity,
  NewsletterSubscriberEntity,
  ContactMessageEntity,
  CmsContentEntity,
  FeatureFlagEntity,
  CategoryEntity,
  ProductEntity,
  PurchaseEntity,
  UserProgressEntity,
  WebinarEntity,
  WebinarSessionEntity,
  WebinarRegistrationEntity,
  GiftEntity,
  ReviewEntity,
];
