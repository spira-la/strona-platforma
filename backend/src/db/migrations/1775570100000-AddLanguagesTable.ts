import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLanguagesTable1775570100000 implements MigrationInterface {
  name = 'AddLanguagesTable1775570100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add parent_id column to categories (missing from initial migration)
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "parent_id" uuid
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "languages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" text NOT NULL,
        "name" text NOT NULL,
        "native_name" text,
        "flag" text,
        "sort_order" integer DEFAULT 0,
        "is_active" boolean DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "UQ_languages_code" UNIQUE ("code"),
        CONSTRAINT "PK_languages" PRIMARY KEY ("id")
      )
    `);

    // Seed default languages (pl, en, es)
    await queryRunner.query(`
      INSERT INTO "languages" ("code", "name", "native_name", "flag", "sort_order") VALUES
        ('pl', 'Polish', 'Polski', '🇵🇱', 0),
        ('en', 'English', 'English', '🇬🇧', 1),
        ('es', 'Spanish', 'Español', '🇪🇸', 2)
      ON CONFLICT ("code") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "languages"`);
  }
}
