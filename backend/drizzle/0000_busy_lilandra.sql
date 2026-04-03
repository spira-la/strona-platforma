CREATE SCHEMA "spirala_dev_schema";
--> statement-breakpoint
CREATE TYPE "spirala_dev_schema"."booking_status" AS ENUM('confirmed', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "spirala_dev_schema"."discount_type" AS ENUM('fixed', 'percentage');--> statement-breakpoint
CREATE TYPE "spirala_dev_schema"."order_status" AS ENUM('pending', 'paid', 'refunded');--> statement-breakpoint
CREATE TYPE "spirala_dev_schema"."product_type" AS ENUM('audio', 'ebook', 'bundle', 'youtube');--> statement-breakpoint
CREATE TYPE "spirala_dev_schema"."purchase_status" AS ENUM('active', 'expired', 'refunded');--> statement-breakpoint
CREATE TYPE "spirala_dev_schema"."subscriber_status" AS ENUM('active', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "spirala_dev_schema"."user_role" AS ENUM('user', 'coach', 'admin');--> statement-breakpoint
CREATE TYPE "spirala_dev_schema"."webinar_session_status" AS ENUM('scheduled', 'live', 'completed');--> statement-breakpoint
CREATE TYPE "spirala_dev_schema"."webinar_status" AS ENUM('draft', 'published', 'live', 'completed');--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."feature_flags" (
	"key" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"email" text NOT NULL,
	"phone" text,
	"timezone" text DEFAULT 'Europe/Warsaw',
	"locale" text DEFAULT 'pl',
	"avatar_url" text,
	"role" "spirala_dev_schema"."user_role" DEFAULT 'user',
	"disabled" boolean DEFAULT false,
	"disabled_reason" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."coaches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"bio" text,
	"expertise" text[],
	"languages" text[],
	"location" text,
	"website" text,
	"timezone" text DEFAULT 'Europe/Warsaw',
	"accepting_clients" boolean DEFAULT true,
	"stripe_connect_id" text,
	"years_experience" integer,
	"certifications" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "coaches_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."coaching_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"duration_minutes" integer NOT NULL,
	"session_count" integer DEFAULT 1,
	"price_cents" integer NOT NULL,
	"currency" text DEFAULT 'PLN',
	"stripe_product_id" text,
	"stripe_price_id" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid,
	"day_of_week" integer,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."availability_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"discount_type" "spirala_dev_schema"."discount_type",
	"discount_value" integer NOT NULL,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"service_id" uuid,
	"status" "spirala_dev_schema"."order_status" DEFAULT 'pending',
	"amount_cents" integer NOT NULL,
	"tax_cents" integer DEFAULT 0,
	"currency" text DEFAULT 'PLN',
	"stripe_payment_intent_id" text,
	"sessions_total" integer NOT NULL,
	"sessions_remaining" integer NOT NULL,
	"invoice_number" text,
	"coupon_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"coach_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" "spirala_dev_schema"."booking_status" DEFAULT 'confirmed',
	"meeting_link" text,
	"notes" text,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"invoice_number" text NOT NULL,
	"recipient_name" text,
	"recipient_email" text,
	"recipient_company" text,
	"recipient_tax_id" text,
	"recipient_address" text,
	"subtotal_cents" integer NOT NULL,
	"tax_cents" integer DEFAULT 0,
	"total_cents" integer NOT NULL,
	"currency" text DEFAULT 'PLN',
	"pdf_url" text,
	"issued_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."blog_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid,
	"user_id" uuid,
	"content" text NOT NULL,
	"is_approved" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" jsonb NOT NULL,
	"excerpt" text,
	"cover_image_url" text,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp with time zone,
	"tags" text[],
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"coach_id" uuid,
	"status" "spirala_dev_schema"."subscriber_status" DEFAULT 'active',
	"unsubscribe_token" text,
	"subscribed_at" timestamp with time zone DEFAULT now(),
	"unsubscribed_at" timestamp with time zone,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "newsletter_subscribers_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"product_type" "spirala_dev_schema"."product_type",
	"category_id" uuid,
	"cover_image_url" text,
	"duration_minutes" integer,
	"language" text,
	"tags" text[],
	"price_cents" integer,
	"currency" text DEFAULT 'PLN',
	"stripe_product_id" text,
	"stripe_price_id" text,
	"is_published" boolean DEFAULT false,
	"author_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"order_id" uuid,
	"status" "spirala_dev_schema"."purchase_status" DEFAULT 'active',
	"purchased_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	CONSTRAINT "purchases_user_product_unique" UNIQUE("user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"progress_percent" numeric(5, 2) DEFAULT '0',
	"current_position_seconds" integer,
	"current_page" integer,
	"chapters_completed" uuid[],
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp with time zone,
	"last_accessed_at" timestamp with time zone DEFAULT now(),
	"time_spent_minutes" integer DEFAULT 0,
	CONSTRAINT "user_progress_user_product_unique" UNIQUE("user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid,
	"coach_id" uuid,
	"rating" integer NOT NULL,
	"content" text,
	"is_published" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."gifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"product_id" uuid,
	"sender_name" text,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"message" text,
	"redeem_code" text NOT NULL,
	"is_redeemed" boolean DEFAULT false,
	"redeemed_by" uuid,
	"redeemed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "gifts_redeem_code_unique" UNIQUE("redeem_code")
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."webinar_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webinar_id" uuid,
	"user_id" uuid,
	"registered_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "webinar_registrations_unique" UNIQUE("webinar_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."webinar_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webinar_id" uuid,
	"session_number" integer,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" "spirala_dev_schema"."webinar_session_status" DEFAULT 'scheduled',
	"livekit_room_name" text,
	"recording_url" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."webinars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"slug" text,
	"host_id" uuid,
	"shadow_host_id" uuid,
	"admin_speaker_ids" uuid[],
	"status" "spirala_dev_schema"."webinar_status" DEFAULT 'draft',
	"max_participants" integer,
	"registered_count" integer DEFAULT 0,
	"language" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "webinars_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spirala_dev_schema"."cms_content" (
	"id" text PRIMARY KEY DEFAULT 'main_page' NOT NULL,
	"content" jsonb NOT NULL,
	"version" integer DEFAULT 1,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."coaches" ADD CONSTRAINT "coaches_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "spirala_dev_schema"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."coaching_services" ADD CONSTRAINT "coaching_services_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "spirala_dev_schema"."coaches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."availability" ADD CONSTRAINT "availability_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "spirala_dev_schema"."coaches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."availability_blocks" ADD CONSTRAINT "availability_blocks_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "spirala_dev_schema"."coaches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."orders" ADD CONSTRAINT "orders_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "spirala_dev_schema"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."orders" ADD CONSTRAINT "orders_service_id_coaching_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "spirala_dev_schema"."coaching_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "spirala_dev_schema"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."bookings" ADD CONSTRAINT "bookings_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "spirala_dev_schema"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."bookings" ADD CONSTRAINT "bookings_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "spirala_dev_schema"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."bookings" ADD CONSTRAINT "bookings_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "spirala_dev_schema"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "spirala_dev_schema"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."blog_comments" ADD CONSTRAINT "blog_comments_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "spirala_dev_schema"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."blog_comments" ADD CONSTRAINT "blog_comments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "spirala_dev_schema"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."blog_posts" ADD CONSTRAINT "blog_posts_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "spirala_dev_schema"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "spirala_dev_schema"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "spirala_dev_schema"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."products" ADD CONSTRAINT "products_author_id_coaches_id_fk" FOREIGN KEY ("author_id") REFERENCES "spirala_dev_schema"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."purchases" ADD CONSTRAINT "purchases_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "spirala_dev_schema"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."purchases" ADD CONSTRAINT "purchases_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "spirala_dev_schema"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."purchases" ADD CONSTRAINT "purchases_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "spirala_dev_schema"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."user_progress" ADD CONSTRAINT "user_progress_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "spirala_dev_schema"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."user_progress" ADD CONSTRAINT "user_progress_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "spirala_dev_schema"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."reviews" ADD CONSTRAINT "reviews_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "spirala_dev_schema"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "spirala_dev_schema"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."reviews" ADD CONSTRAINT "reviews_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "spirala_dev_schema"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."gifts" ADD CONSTRAINT "gifts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "spirala_dev_schema"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."gifts" ADD CONSTRAINT "gifts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "spirala_dev_schema"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."gifts" ADD CONSTRAINT "gifts_redeemed_by_profiles_id_fk" FOREIGN KEY ("redeemed_by") REFERENCES "spirala_dev_schema"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."webinar_registrations" ADD CONSTRAINT "webinar_registrations_webinar_id_webinars_id_fk" FOREIGN KEY ("webinar_id") REFERENCES "spirala_dev_schema"."webinars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."webinar_registrations" ADD CONSTRAINT "webinar_registrations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "spirala_dev_schema"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."webinar_sessions" ADD CONSTRAINT "webinar_sessions_webinar_id_webinars_id_fk" FOREIGN KEY ("webinar_id") REFERENCES "spirala_dev_schema"."webinars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."webinars" ADD CONSTRAINT "webinars_host_id_coaches_id_fk" FOREIGN KEY ("host_id") REFERENCES "spirala_dev_schema"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."webinars" ADD CONSTRAINT "webinars_shadow_host_id_coaches_id_fk" FOREIGN KEY ("shadow_host_id") REFERENCES "spirala_dev_schema"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spirala_dev_schema"."cms_content" ADD CONSTRAINT "cms_content_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "spirala_dev_schema"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coaches_user_id_idx" ON "spirala_dev_schema"."coaches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coaching_services_coach_id_idx" ON "spirala_dev_schema"."coaching_services" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "availability_coach_id_idx" ON "spirala_dev_schema"."availability" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "availability_blocks_coach_id_idx" ON "spirala_dev_schema"."availability_blocks" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "coupons_code_idx" ON "spirala_dev_schema"."coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "spirala_dev_schema"."orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "spirala_dev_schema"."orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_stripe_payment_intent_idx" ON "spirala_dev_schema"."orders" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "bookings_coach_id_idx" ON "spirala_dev_schema"."bookings" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "bookings_user_id_idx" ON "spirala_dev_schema"."bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_start_time_idx" ON "spirala_dev_schema"."bookings" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "spirala_dev_schema"."bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoices_order_id_idx" ON "spirala_dev_schema"."invoices" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "invoices_invoice_number_idx" ON "spirala_dev_schema"."invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "blog_comments_post_id_idx" ON "spirala_dev_schema"."blog_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "blog_posts_slug_idx" ON "spirala_dev_schema"."blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_posts_is_published_idx" ON "spirala_dev_schema"."blog_posts" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "blog_posts_published_at_idx" ON "spirala_dev_schema"."blog_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_email_idx" ON "spirala_dev_schema"."newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_coach_id_idx" ON "spirala_dev_schema"."newsletter_subscribers" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "categories_slug_idx" ON "spirala_dev_schema"."categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_slug_idx" ON "spirala_dev_schema"."products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_is_published_idx" ON "spirala_dev_schema"."products" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "products_product_type_idx" ON "spirala_dev_schema"."products" USING btree ("product_type");--> statement-breakpoint
CREATE INDEX "purchases_user_id_idx" ON "spirala_dev_schema"."purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "purchases_product_id_idx" ON "spirala_dev_schema"."purchases" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "user_progress_user_id_idx" ON "spirala_dev_schema"."user_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_user_id_idx" ON "spirala_dev_schema"."reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_product_id_idx" ON "spirala_dev_schema"."reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "reviews_coach_id_idx" ON "spirala_dev_schema"."reviews" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "gifts_redeem_code_idx" ON "spirala_dev_schema"."gifts" USING btree ("redeem_code");--> statement-breakpoint
CREATE INDEX "gifts_recipient_email_idx" ON "spirala_dev_schema"."gifts" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX "webinar_registrations_webinar_id_idx" ON "spirala_dev_schema"."webinar_registrations" USING btree ("webinar_id");--> statement-breakpoint
CREATE INDEX "webinar_registrations_user_id_idx" ON "spirala_dev_schema"."webinar_registrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "webinar_sessions_webinar_id_idx" ON "spirala_dev_schema"."webinar_sessions" USING btree ("webinar_id");--> statement-breakpoint
CREATE INDEX "webinars_slug_idx" ON "spirala_dev_schema"."webinars" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "webinars_status_idx" ON "spirala_dev_schema"."webinars" USING btree ("status");