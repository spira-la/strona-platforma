import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns the `coaches` table with CoachEntity.
 *
 * Entity expects:                    Migration had:
 *   bio           text               short_bio / full_bio (wrong names)
 *   expertise     text[]             specializations text (wrong name + type)
 *   languages     text[]             languages text (wrong type, not array)
 *   location      text               (missing)
 *   website       text               (missing)
 *   timezone      text               (missing)
 *   accepting_clients boolean        (missing)
 *   stripe_connect_id text           stripe_account_id (wrong name)
 *   years_experience int             (missing)
 *   certifications text[]            certifications text (wrong type, not array)
 *   updated_at    timestamptz        (missing)
 *
 * Columns in the old migration that do NOT map to any entity field are dropped:
 *   display_name, slug, short_bio, full_bio, specializations,
 *   stripe_onboarded, commission_rate, is_verified
 */
export class AlignCoachesSchema1775570300000 implements MigrationInterface {
  name = 'AlignCoachesSchema1775570300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add all missing columns
    await queryRunner.query(`
      ALTER TABLE "coaches"
        ADD COLUMN IF NOT EXISTS "bio"               text,
        ADD COLUMN IF NOT EXISTS "expertise"         text[],
        ADD COLUMN IF NOT EXISTS "location"          text,
        ADD COLUMN IF NOT EXISTS "website"           text,
        ADD COLUMN IF NOT EXISTS "timezone"          text DEFAULT 'Europe/Warsaw',
        ADD COLUMN IF NOT EXISTS "accepting_clients" boolean DEFAULT true,
        ADD COLUMN IF NOT EXISTS "stripe_connect_id" text,
        ADD COLUMN IF NOT EXISTS "years_experience"  integer,
        ADD COLUMN IF NOT EXISTS "updated_at"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    `);

    // 2. Migrate data: short_bio / full_bio -> bio
    await queryRunner.query(`
      UPDATE "coaches"
      SET "bio" = COALESCE("short_bio", "full_bio")
      WHERE "bio" IS NULL
        AND ("short_bio" IS NOT NULL OR "full_bio" IS NOT NULL)
    `);

    // 3. Migrate data: stripe_account_id -> stripe_connect_id
    await queryRunner.query(`
      UPDATE "coaches"
      SET "stripe_connect_id" = "stripe_account_id"
      WHERE "stripe_connect_id" IS NULL AND "stripe_account_id" IS NOT NULL
    `);

    // 4. Fix `languages` column type: old text -> text[]
    //    Add a new array column, populate it from the old text value, swap names.
    await queryRunner.query(`
      ALTER TABLE "coaches"
        ADD COLUMN IF NOT EXISTS "languages_new" text[]
    `);

    await queryRunner.query(`
      UPDATE "coaches"
      SET "languages_new" = CASE
        WHEN "languages" IS NOT NULL AND trim("languages") <> '' THEN ARRAY["languages"]
        ELSE NULL
      END
    `);

    await queryRunner.query(
      `ALTER TABLE "coaches" DROP COLUMN IF EXISTS "languages"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" RENAME COLUMN "languages_new" TO "languages"`,
    );

    // 5. Fix `certifications` column type: old text -> text[]
    await queryRunner.query(`
      ALTER TABLE "coaches"
        ADD COLUMN IF NOT EXISTS "certifications_new" text[]
    `);

    await queryRunner.query(`
      UPDATE "coaches"
      SET "certifications_new" = CASE
        WHEN "certifications" IS NOT NULL AND trim("certifications") <> '' THEN ARRAY["certifications"]
        ELSE NULL
      END
    `);

    await queryRunner.query(
      `ALTER TABLE "coaches" DROP COLUMN IF EXISTS "certifications"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" RENAME COLUMN "certifications_new" TO "certifications"`,
    );

    // 6. Drop obsolete columns that have no corresponding entity field
    await queryRunner.query(`
      ALTER TABLE "coaches"
        DROP COLUMN IF EXISTS "display_name",
        DROP COLUMN IF EXISTS "slug",
        DROP COLUMN IF EXISTS "short_bio",
        DROP COLUMN IF EXISTS "full_bio",
        DROP COLUMN IF EXISTS "specializations",
        DROP COLUMN IF EXISTS "stripe_account_id",
        DROP COLUMN IF EXISTS "stripe_onboarded",
        DROP COLUMN IF EXISTS "commission_rate",
        DROP COLUMN IF EXISTS "is_verified"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore old columns
    await queryRunner.query(`
      ALTER TABLE "coaches"
        ADD COLUMN IF NOT EXISTS "display_name"      text,
        ADD COLUMN IF NOT EXISTS "slug"              text,
        ADD COLUMN IF NOT EXISTS "short_bio"         text,
        ADD COLUMN IF NOT EXISTS "full_bio"          text,
        ADD COLUMN IF NOT EXISTS "specializations"   text,
        ADD COLUMN IF NOT EXISTS "stripe_account_id" text,
        ADD COLUMN IF NOT EXISTS "stripe_onboarded"  boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "commission_rate"   integer NOT NULL DEFAULT 15,
        ADD COLUMN IF NOT EXISTS "is_verified"       boolean NOT NULL DEFAULT false
    `);

    // Migrate data back
    await queryRunner.query(`
      UPDATE "coaches" SET "short_bio" = "bio" WHERE "bio" IS NOT NULL
    `);

    await queryRunner.query(`
      UPDATE "coaches"
      SET "stripe_account_id" = "stripe_connect_id"
      WHERE "stripe_connect_id" IS NOT NULL
    `);

    // Convert certifications text[] back to text
    await queryRunner.query(`
      ALTER TABLE "coaches"
        ADD COLUMN IF NOT EXISTS "certifications_old" text
    `);
    await queryRunner.query(`
      UPDATE "coaches"
      SET "certifications_old" = array_to_string("certifications", ',')
      WHERE "certifications" IS NOT NULL
    `);
    await queryRunner.query(
      `ALTER TABLE "coaches" DROP COLUMN IF EXISTS "certifications"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" RENAME COLUMN "certifications_old" TO "certifications"`,
    );

    // Convert languages text[] back to text
    await queryRunner.query(`
      ALTER TABLE "coaches"
        ADD COLUMN IF NOT EXISTS "languages_old" text DEFAULT 'pl'
    `);
    await queryRunner.query(`
      UPDATE "coaches"
      SET "languages_old" = COALESCE("languages"[1], 'pl')
      WHERE "languages" IS NOT NULL
    `);
    await queryRunner.query(
      `ALTER TABLE "coaches" DROP COLUMN IF EXISTS "languages"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" RENAME COLUMN "languages_old" TO "languages"`,
    );

    // Remove columns added in `up`
    await queryRunner.query(`
      ALTER TABLE "coaches"
        DROP COLUMN IF EXISTS "bio",
        DROP COLUMN IF EXISTS "expertise",
        DROP COLUMN IF EXISTS "location",
        DROP COLUMN IF EXISTS "website",
        DROP COLUMN IF EXISTS "timezone",
        DROP COLUMN IF EXISTS "accepting_clients",
        DROP COLUMN IF EXISTS "stripe_connect_id",
        DROP COLUMN IF EXISTS "years_experience",
        DROP COLUMN IF EXISTS "updated_at"
    `);
  }
}
