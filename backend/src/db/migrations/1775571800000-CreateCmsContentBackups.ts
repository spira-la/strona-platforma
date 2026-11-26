import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Snapshots of the CMS JSONB document, taken before "Clean CMS" resets and
 * backup restores. Purely additive: one new table.
 */
export class CreateCmsContentBackups1775571800000 implements MigrationInterface {
  name = 'CreateCmsContentBackups1775571800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cms_content_backups" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "content" jsonb NOT NULL,
        "reason" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" uuid,
        CONSTRAINT "PK_cms_content_backups_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "cms_content_backups_created_at_idx" ON "cms_content_backups" ("created_at" DESC)`,
    );
    // Server-only table (accessed via the API's DB connection, never PostgREST).
    await queryRunner.query(
      `ALTER TABLE "cms_content_backups" ENABLE ROW LEVEL SECURITY`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cms_content_backups"`);
  }
}
