export * from './enums';
export * from './profile.entity';
export * from './coach.entity';
export * from './coaching-service.entity';
export * from './availability.entity';
export * from './coupon.entity';
export * from './order.entity';
export * from './booking.entity';
export * from './invoice.entity';
export * from './blog.entity';
export * from './newsletter.entity';
export * from './contact.entity';
export * from './cms-content.entity';
export * from './feature-flag.entity';
export * from './product.entity';
export * from './purchase.entity';
export * from './webinar.entity';
export * from './gift.entity';
export * from './review.entity';
export * from './language.entity';

import { ProfileEntity } from './profile.entity';
import { CoachEntity } from './coach.entity';
import { CoachingServiceEntity } from './coaching-service.entity';
import { AvailabilityEntity, AvailabilityBlockEntity } from './availability.entity';
import { CouponEntity } from './coupon.entity';
import { OrderEntity } from './order.entity';
import { BookingEntity } from './booking.entity';
import { InvoiceEntity } from './invoice.entity';
import { BlogPostEntity, BlogCommentEntity } from './blog.entity';
import { NewsletterSubscriberEntity } from './newsletter.entity';
import { ContactMessageEntity } from './contact.entity';
import { CmsContentEntity } from './cms-content.entity';
import { FeatureFlagEntity } from './feature-flag.entity';
import { CategoryEntity, ProductEntity } from './product.entity';
import { PurchaseEntity, UserProgressEntity } from './purchase.entity';
import { WebinarEntity, WebinarSessionEntity, WebinarRegistrationEntity } from './webinar.entity';
import { GiftEntity } from './gift.entity';
import { ReviewEntity } from './review.entity';
import { LanguageEntity } from './language.entity';

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
  LanguageEntity,
];
