import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1775570000000 implements MigrationInterface {
  name = 'InitialSchema1775570000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Feature Flags ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "feature_flags" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "description" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_feature_flags_name" UNIQUE ("name"),
        CONSTRAINT "PK_feature_flags" PRIMARY KEY ("id")
      )
    `);

    // ─── Profiles ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "profiles" (
        "id" uuid NOT NULL,
        "email" text NOT NULL,
        "full_name" text,
        "avatar_url" text,
        "role" text NOT NULL DEFAULT 'user',
        "phone" text,
        "bio" text,
        "website" text,
        "timezone" text NOT NULL DEFAULT 'Europe/Warsaw',
        "preferred_language" text NOT NULL DEFAULT 'pl',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_profiles_email" UNIQUE ("email"),
        CONSTRAINT "PK_profiles" PRIMARY KEY ("id")
      )
    `);

    // ─── Coaches ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coaches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "display_name" text,
        "slug" text,
        "short_bio" text,
        "full_bio" text,
        "specializations" text,
        "certifications" text,
        "languages" text DEFAULT 'pl',
        "stripe_account_id" text,
        "stripe_onboarded" boolean NOT NULL DEFAULT false,
        "commission_rate" integer NOT NULL DEFAULT 15,
        "is_verified" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_coaches_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_coaches" PRIMARY KEY ("id"),
        CONSTRAINT "FK_coaches_user_id" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE
      )
    `);

    // ─── Coaching Services ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coaching_services" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "coach_id" uuid,
        "name" text NOT NULL,
        "description" text,
        "duration_minutes" integer NOT NULL,
        "session_count" integer NOT NULL DEFAULT 1,
        "price_cents" integer NOT NULL,
        "currency" text NOT NULL DEFAULT 'PLN',
        "stripe_product_id" text,
        "stripe_price_id" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_coaching_services" PRIMARY KEY ("id"),
        CONSTRAINT "FK_coaching_services_coach_id" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE
      )
    `);

    // ─── Availability ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "availability" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "coach_id" uuid,
        "day_of_week" integer NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_availability" PRIMARY KEY ("id"),
        CONSTRAINT "FK_availability_coach_id" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "availability_blocks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "coach_id" uuid,
        "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "reason" text,
        CONSTRAINT "PK_availability_blocks" PRIMARY KEY ("id"),
        CONSTRAINT "FK_availability_blocks_coach_id" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE
      )
    `);

    // ─── Coupons ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coupons" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" text NOT NULL,
        "discount_type" text,
        "discount_value" integer NOT NULL,
        "max_uses" integer,
        "current_uses" integer NOT NULL DEFAULT 0,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_coupons_code" UNIQUE ("code"),
        CONSTRAINT "PK_coupons" PRIMARY KEY ("id")
      )
    `);

    // ─── Orders ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "service_id" uuid,
        "coupon_id" uuid,
        "status" text NOT NULL DEFAULT 'pending',
        "amount_cents" integer NOT NULL,
        "discount_cents" integer NOT NULL DEFAULT 0,
        "currency" text NOT NULL DEFAULT 'PLN',
        "stripe_payment_intent_id" text,
        "stripe_checkout_session_id" text,
        "invoice_requested" boolean NOT NULL DEFAULT false,
        "notes" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_user_id" FOREIGN KEY ("user_id") REFERENCES "profiles"("id"),
        CONSTRAINT "FK_orders_service_id" FOREIGN KEY ("service_id") REFERENCES "coaching_services"("id"),
        CONSTRAINT "FK_orders_coupon_id" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id")
      )
    `);

    // ─── Bookings ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bookings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "order_id" uuid,
        "coach_id" uuid,
        "user_id" uuid,
        "service_name" text,
        "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" text NOT NULL DEFAULT 'confirmed',
        "notes" text,
        "meeting_url" text,
        "cancellation_reason" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bookings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bookings_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id"),
        CONSTRAINT "FK_bookings_coach_id" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id"),
        CONSTRAINT "FK_bookings_user_id" FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
      )
    `);

    // ─── Invoices ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoices" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "order_id" uuid,
        "invoice_number" text NOT NULL,
        "seller_name" text,
        "seller_address" text,
        "seller_nip" text,
        "recipient_name" text,
        "recipient_address" text,
        "recipient_nip" text,
        "recipient_email" text,
        "amount_cents" integer NOT NULL,
        "currency" text NOT NULL DEFAULT 'PLN',
        "pdf_url" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_invoices_invoice_number" UNIQUE ("invoice_number"),
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_invoices_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      )
    `);

    // ─── Blog ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_posts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "author_id" uuid,
        "slug" text NOT NULL,
        "title" text NOT NULL,
        "excerpt" text,
        "content" text,
        "cover_image_url" text,
        "category" text,
        "tags" text,
        "is_published" boolean NOT NULL DEFAULT false,
        "published_at" TIMESTAMP WITH TIME ZONE,
        "meta_title" text,
        "meta_description" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_blog_posts_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_blog_posts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_blog_posts_author_id" FOREIGN KEY ("author_id") REFERENCES "profiles"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_comments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "post_id" uuid,
        "user_id" uuid,
        "content" text NOT NULL,
        "is_approved" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blog_comments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_blog_comments_post_id" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_blog_comments_user_id" FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
      )
    `);

    // ─── Newsletter ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "coach_id" uuid,
        "email" text NOT NULL,
        "full_name" text,
        "status" text NOT NULL DEFAULT 'active',
        "unsubscribe_token" text,
        "subscribed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_newsletter_subscribers_unsubscribe_token" UNIQUE ("unsubscribe_token"),
        CONSTRAINT "PK_newsletter_subscribers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_newsletter_subscribers_coach_id" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id")
      )
    `);

    // ─── Contact Messages ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contact_messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "full_name" text NOT NULL,
        "email" text NOT NULL,
        "phone" text,
        "subject" text,
        "message" text NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contact_messages" PRIMARY KEY ("id")
      )
    `);

    // ─── CMS Content ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cms_content" (
        "id" text NOT NULL DEFAULT 'main_page',
        "content" jsonb NOT NULL DEFAULT '{}',
        "version" integer NOT NULL DEFAULT 1,
        "updated_by" uuid,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cms_content" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cms_content_updated_by" FOREIGN KEY ("updated_by") REFERENCES "profiles"("id")
      )
    `);

    // ─── Categories ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "slug" text NOT NULL,
        "description" text,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);

    // ─── Products ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "author_id" uuid,
        "category_id" uuid,
        "product_type" text,
        "title" text NOT NULL,
        "slug" text NOT NULL,
        "description" text,
        "short_description" text,
        "cover_image_url" text,
        "preview_url" text,
        "content_url" text,
        "price_cents" integer NOT NULL,
        "currency" text NOT NULL DEFAULT 'PLN',
        "stripe_product_id" text,
        "stripe_price_id" text,
        "is_published" boolean NOT NULL DEFAULT false,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_products_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "FK_products_author_id" FOREIGN KEY ("author_id") REFERENCES "coaches"("id"),
        CONSTRAINT "FK_products_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id")
      )
    `);

    // ─── Purchases ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "purchases" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "product_id" uuid,
        "order_id" uuid,
        "status" text NOT NULL DEFAULT 'active',
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchases" PRIMARY KEY ("id"),
        CONSTRAINT "FK_purchases_user_id" FOREIGN KEY ("user_id") REFERENCES "profiles"("id"),
        CONSTRAINT "FK_purchases_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id"),
        CONSTRAINT "FK_purchases_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      )
    `);

    // ─── User Progress ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_progress" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "product_id" uuid,
        "current_position" integer NOT NULL DEFAULT 0,
        "total_items" integer NOT NULL DEFAULT 0,
        "completed_items" text,
        "last_accessed_at" TIMESTAMP WITH TIME ZONE,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "notes" text,
        "is_completed" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_progress" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_progress_user_id" FOREIGN KEY ("user_id") REFERENCES "profiles"("id"),
        CONSTRAINT "FK_user_progress_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id")
      )
    `);

    // ─── Webinars ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "webinars" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "host_id" uuid,
        "shadow_host_id" uuid,
        "title" text NOT NULL,
        "slug" text NOT NULL,
        "description" text,
        "cover_image_url" text,
        "price_cents" integer NOT NULL DEFAULT 0,
        "currency" text NOT NULL DEFAULT 'PLN',
        "max_participants" integer,
        "status" text NOT NULL DEFAULT 'draft',
        "stripe_product_id" text,
        "stripe_price_id" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_webinars_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_webinars" PRIMARY KEY ("id"),
        CONSTRAINT "FK_webinars_host_id" FOREIGN KEY ("host_id") REFERENCES "coaches"("id"),
        CONSTRAINT "FK_webinars_shadow_host_id" FOREIGN KEY ("shadow_host_id") REFERENCES "coaches"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "webinar_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "webinar_id" uuid,
        "title" text,
        "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "duration_minutes" integer NOT NULL DEFAULT 60,
        "status" text NOT NULL DEFAULT 'scheduled',
        "livekit_room_name" text,
        "recording_url" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_webinar_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_webinar_sessions_webinar_id" FOREIGN KEY ("webinar_id") REFERENCES "webinars"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "webinar_registrations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "webinar_id" uuid,
        "user_id" uuid,
        "registered_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_webinar_registrations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_webinar_registrations_webinar_id" FOREIGN KEY ("webinar_id") REFERENCES "webinars"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_webinar_registrations_user_id" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE
      )
    `);

    // ─── Reviews ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "coach_id" uuid,
        "product_id" uuid,
        "rating" integer NOT NULL,
        "comment" text,
        "is_approved" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reviews_user_id" FOREIGN KEY ("user_id") REFERENCES "profiles"("id"),
        CONSTRAINT "FK_reviews_coach_id" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id"),
        CONSTRAINT "FK_reviews_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id")
      )
    `);

    // ─── Gifts ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "gifts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "order_id" uuid,
        "product_id" uuid,
        "gift_code" text NOT NULL,
        "sender_name" text,
        "sender_email" text,
        "recipient_name" text,
        "recipient_email" text,
        "personal_message" text,
        "redeemed_by" uuid,
        "redeemed_at" TIMESTAMP WITH TIME ZONE,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_gifts_gift_code" UNIQUE ("gift_code"),
        CONSTRAINT "PK_gifts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_gifts_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id"),
        CONSTRAINT "FK_gifts_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id"),
        CONSTRAINT "FK_gifts_redeemed_by" FOREIGN KEY ("redeemed_by") REFERENCES "profiles"("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "gifts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "webinar_registrations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "webinar_sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "webinars" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_progress" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "purchases" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cms_content" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_messages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "newsletter_subscribers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blog_comments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blog_posts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bookings" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coupons" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "availability_blocks" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "availability" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coaching_services" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coaches" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "profiles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feature_flags" CASCADE`);
  }
}
