import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns the `profiles` table with ProfileEntity.
 *
 * Entity expects:            DB had (from InitialSchema):
 *   locale                     preferred_language (wrong name)
 *   disabled                   (missing)
 *   disabled_reason            (missing)
 *   updated_at                 (missing)
 *
 * Also drops columns that are no longer on the entity: bio, website,
 * is_active.
 */
export class AlignProfilesSchema1775570600000 implements MigrationInterface {
  name = 'AlignProfilesSchema1775570600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add missing columns
    await queryRunner.query(`
      ALTER TABLE "profiles"
        ADD COLUMN IF NOT EXISTS "locale"          text DEFAULT 'pl',
        ADD COLUMN IF NOT EXISTS "disabled"        boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS "disabled_reason" text,
        ADD COLUMN IF NOT EXISTS "updated_at"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    `);

    // 2. Copy preferred_language -> locale (if source exists)
    const cols = (await queryRunner.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'profiles' AND column_name = 'preferred_language'`,
    )) as Array<{ column_name: string }>;
    if (Array.isArray(cols) && cols.length > 0) {
      await queryRunner.query(`
        UPDATE "profiles" SET "locale" = "preferred_language"
        WHERE "locale" IS NULL AND "preferred_language" IS NOT NULL
      `);
      await queryRunner.query(
        `ALTER TABLE "profiles" DROP COLUMN IF EXISTS "preferred_language"`,
      );
    }

    // 3. Drop obsolete columns no longer on the entity
    await queryRunner.query(`
      ALTER TABLE "profiles"
        DROP COLUMN IF EXISTS "bio",
        DROP COLUMN IF EXISTS "website",
        DROP COLUMN IF EXISTS "is_active"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "profiles"
        ADD COLUMN IF NOT EXISTS "preferred_language" text NOT NULL DEFAULT 'pl',
        ADD COLUMN IF NOT EXISTS "bio"                text,
        ADD COLUMN IF NOT EXISTS "website"            text,
        ADD COLUMN IF NOT EXISTS "is_active"          boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      UPDATE "profiles" SET "preferred_language" = COALESCE("locale", 'pl')
    `);

    await queryRunner.query(`
      ALTER TABLE "profiles"
        DROP COLUMN IF EXISTS "locale",
        DROP COLUMN IF EXISTS "disabled",
        DROP COLUMN IF EXISTS "disabled_reason",
        DROP COLUMN IF EXISTS "updated_at"
    `);
  }
}
