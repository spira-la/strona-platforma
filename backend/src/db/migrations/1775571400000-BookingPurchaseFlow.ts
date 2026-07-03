import { MigrationInterface, QueryRunner } from 'typeorm';

export class BookingPurchaseFlow1775571400000 implements MigrationInterface {
  name = 'BookingPurchaseFlow1775571400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "coaches"
        ADD COLUMN IF NOT EXISTS "min_cancellation_notice_minutes" INT DEFAULT 1440,
        ADD COLUMN IF NOT EXISTS "rest_time_between_sessions_minutes" INT DEFAULT 15
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS "livekit_room_name" TEXT,
        ADD COLUMN IF NOT EXISTS "rescheduled_at" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "rescheduled_from" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "reschedule_reason" TEXT,
        ADD COLUMN IF NOT EXISTS "reschedule_count" INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "service_id" UUID
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
        ADD COLUMN IF NOT EXISTS "discount_cents" INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "coach_id" UUID,
        ADD COLUMN IF NOT EXISTS "customer_email" TEXT,
        ADD COLUMN IF NOT EXISTS "customer_name" TEXT,
        ADD COLUMN IF NOT EXISTS "customer_phone" TEXT,
        ADD COLUMN IF NOT EXISTS "invoice_data" JSONB,
        ADD COLUMN IF NOT EXISTS "booking_slots" JSONB,
        ADD COLUMN IF NOT EXISTS "notes" TEXT
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "slot_holds" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "coach_id" UUID NOT NULL,
        "user_id" UUID,
        "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "order_id" UUID,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "slot_holds_coach_start_idx" ON "slot_holds" ("coach_id","start_time")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "slot_holds_expires_idx" ON "slot_holds" ("expires_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "slot_holds_order_idx" ON "slot_holds" ("order_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "slot_holds"`);

    await queryRunner.query(`
      ALTER TABLE "orders"
        DROP COLUMN IF EXISTS "discount_cents",
        DROP COLUMN IF EXISTS "coach_id",
        DROP COLUMN IF EXISTS "customer_email",
        DROP COLUMN IF EXISTS "customer_name",
        DROP COLUMN IF EXISTS "customer_phone",
        DROP COLUMN IF EXISTS "invoice_data",
        DROP COLUMN IF EXISTS "booking_slots",
        DROP COLUMN IF EXISTS "notes"
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
        DROP COLUMN IF EXISTS "livekit_room_name",
        DROP COLUMN IF EXISTS "rescheduled_at",
        DROP COLUMN IF EXISTS "rescheduled_from",
        DROP COLUMN IF EXISTS "reschedule_reason",
        DROP COLUMN IF EXISTS "reschedule_count",
        DROP COLUMN IF EXISTS "service_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "coaches"
        DROP COLUMN IF EXISTS "min_cancellation_notice_minutes",
        DROP COLUMN IF EXISTS "rest_time_between_sessions_minutes"
    `);
  }
}
