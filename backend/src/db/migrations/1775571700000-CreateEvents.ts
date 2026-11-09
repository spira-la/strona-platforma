import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Events the coach adds from the admin panel (/wydarzenia, 2026-11 redesign)
 * and their e-mail sign-ups. Purely additive: two new tables, nothing else in
 * the schema changes. The hidden `webinars*` tables are left as they are.
 */
export class CreateEvents1775571700000 implements MigrationInterface {
  name = 'CreateEvents1775571700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" text NOT NULL,
        "description" text,
        "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ends_at" TIMESTAMP WITH TIME ZONE,
        "location" text,
        "is_online" boolean NOT NULL DEFAULT false,
        "price_label" text,
        "capacity" integer,
        "image_url" text,
        "is_published" boolean NOT NULL DEFAULT false,
        "registration_open" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_events_capacity_positive" CHECK ("capacity" IS NULL OR "capacity" > 0)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "events_starts_at_idx" ON "events" ("starts_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "events_published_idx" ON "events" ("is_published")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_registrations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "event_id" uuid NOT NULL,
        "full_name" text NOT NULL,
        "email" text NOT NULL,
        "phone" text,
        "message" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_registrations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_event_registrations_event" FOREIGN KEY ("event_id")
          REFERENCES "events" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "event_registrations_event_id_idx" ON "event_registrations" ("event_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "event_registrations_event_email_uq" ON "event_registrations" ("event_id", "email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "event_registrations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "events"`);
  }
}
